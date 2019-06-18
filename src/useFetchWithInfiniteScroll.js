import _ from 'lodash'
import { useEffect, useRef, useReducer } from 'react'
import axios from 'axios'
import { CONTENTFUL_REST_URL, convertContentfulEntryResponse } from '../utils/contentful'

/**
 * Determine if there are more posts to display on the next page
 * @param {number} total total posts
 * @param {number} skip skipped posts
 * @param {number} limit the number of posts on the current page
 */
const nextPage = (total, skip, limit) => {
  return total > skip + limit
}

/**
 * Transform Contentful API's response
 * @param {{
 *  items: Array,
 *  includes: {
 *    Entry: Array,
 *    Asset: Array
 *  },
 * }} data Contentful's response
 * @returns {Object<string, any>}
 */
const constructPostData = data => {
  const posts = _.get(data, 'items')
  const entries = _.get(data, 'includes.Entry', [])
  const assets = _.get(data, 'includes.Asset', [])
  const formattedResponse = convertContentfulEntryResponse(posts, [...assets, ...entries])
  return formattedResponse
}

/**
 * @typedef {Object<string, any>} Action
 * @property {string} type
 * @property {Object<string, any>} [payload] Contentful API's response
 * @property {number} [resetSkipPostsTo] Post amount of the first page
 */
/**
 * Reducer to be used inside hook
 * @param {*} state previous state
 * @param {Action} action
 * @returns {Object<string, any>} updated state
 */
const reducer = (state, action) => {
  switch (action.type) {
    case 'FETCH_START':
      return { ...state, isLoading: true, isError: false }
    case 'FETCH_FIRST_PAGE_SUCCESS': {
      const { total, skip, limit, items } = action.payload
      let posts
      if (_.isEmpty(items)) {
        posts = []
      } else {
        posts = constructPostData(action.payload)
      }
      return {
        posts,
        isLoading: false,
        isError: false,
        skipPosts: action.resetSkipPostsTo,
        hasNextPage: nextPage(total, skip, limit)
      }
    }
    case 'FETCH_MORE_SUCCESS': {
      // Fetched posts cannot be empty [] because we check hasNextPage before fetching
      // Therefore, no need to check isEmpty(posts)
      const { total, skip, limit } = action.payload
      const newPosts = constructPostData(action.payload)
      return {
        ...state,
        posts: [...state.posts, ...newPosts],
        isLoading: false,
        isError: false,
        skipPosts: state.skipPosts + Number(limit),
        hasNextPage: nextPage(total, skip, limit)
      }
    }
    case 'FETCH_FAIL':
      return { ...state, isLoading: false, isError: true }
    default:
      throw new Error('Unknown type of action in reducer')
  }
}

/**
 *
 * @param {number} firstPagePostAmount
 * @param {number} nextPagePostAmount
 * @param {string} [query = ''] query to be concated to the url according to
 *      Contentful's REST API documentation, e.g. "&fields.tag=education"
 * @param {number} [distanceFromBottomToFetchNextPage = 0] distance from
 *      the bottom of the page (in px) to trigger infinite scrolling
 * @returns {{ posts: Array, isLoading: boolean, isError: boolean }} note that isLoading will
 *      be true not only while fetching the first page but also while fetching
 *      the next page through infinite scrolling
 */
export const useFetctPostsWithInfiniteScroll = (
  firstPagePostAmount,
  nextPagePostAmount,
  query = '',
  distanceFromBottomToFetchNextPage = 0
) => {
  const isFetchingNextPage = useRef(false)
  const [state, dispatch] = useReducer(reducer, {
    posts: [],
    isLoading: false,
    isError: false,
    skipPosts: firstPagePostAmount,
    hasNextPage: false
  })

  // Fetch posts of the first page
  useEffect(() => {
    const FIRST_PAGE_QUERY =
      `${CONTENTFUL_REST_URL}&content_type=post&include=1` +
      `${query}&order=-fields.publishDate` +
      `&limit=${firstPagePostAmount}`

    const findPosts = async () => {
      dispatch({ type: 'FETCH_START' })
      try {
        const response = await axios.get(FIRST_PAGE_QUERY)
        dispatch({
          type: 'FETCH_FIRST_PAGE_SUCCESS',
          payload: _.get(response, 'data', {}),
          resetSkipPostsTo: firstPagePostAmount
        })
      } catch (e) {
        console.log(`Error when trying to fetch posts by query: ${query}`, e)
        dispatch({ type: 'FETCH_FAIL' })
      }
    }

    findPosts()
  }, [firstPagePostAmount, query])

  // (Infinite Scroll) Fetch next page posts when scrolling to the bottom of the previous page
  useEffect(() => {
    const NEXT_PAGE_QUERY =
      `${CONTENTFUL_REST_URL}&content_type=post&include=1` +
      `${query}&order=-fields.publishDate` +
      `&limit=${nextPagePostAmount}&skip=${state.skipPosts}`

    const fetchNextPage = async () => {
      isFetchingNextPage.current = true
      dispatch({ type: 'FETCH_START' })
      try {
        const response = await axios.get(NEXT_PAGE_QUERY)
        dispatch({
          type: 'FETCH_MORE_SUCCESS',
          payload: _.get(response, 'data', {})
        })
      } catch (e) {
        console.log(
          `Error when trying to fetch more posts of query: ${query}` +
            `, limit: ${nextPagePostAmount} and skip: ${state.skipPosts}`,
          e
        )
        dispatch({ type: 'FETCH_FAIL' })
      }
      isFetchingNextPage.current = false
    }

    const handleInfiniteScroll = () => {
      // Height of the whole document regardless to browser/device
      // read more on: https://javascript.info/size-and-scroll-window
      const scrollHeight = Math.max(
        document.body.scrollHeight,
        document.documentElement.scrollHeight,
        document.body.offsetHeight,
        document.documentElement.offsetHeight,
        document.body.clientHeight,
        document.documentElement.clientHeight
      )

      if (
        state.hasNextPage &&
        !isFetchingNextPage.current &&
        document.documentElement.clientHeight + window.pageYOffset >=
          scrollHeight - Number(distanceFromBottomToFetchNextPage)
      ) {
        fetchNextPage()
      }
    }

    window.addEventListener('scroll', handleInfiniteScroll)
    return () => window.removeEventListener('scroll', handleInfiniteScroll)
  }, [
    query,
    nextPagePostAmount,
    distanceFromBottomToFetchNextPage,
    state.skipPosts,
    state.hasNextPage
  ])

  return { posts: state.posts, isLoading: state.isLoading, isError: state.isError }
}
