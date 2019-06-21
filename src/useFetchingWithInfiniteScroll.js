import _ from 'lodash'
import { useEffect, useRef, useReducer } from 'react'
import axios from 'axios'

/**
 * @typedef {Object<string, any>} Action
 * @property {string} type
 * @property {Object<string, any>} [payload] Contentful API's response
 * @property {number} [resetSkipPokemonsTo] Pokemon amount of the first page
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
      const { count, next, previous, results } = action.payload
      let pokemons
      if (_.isEmpty(results)) {
        pokemons = []
      } else {
        pokemons = results
      }
      return {
        pokemons,
        isLoading: false,
        isError: false,
        skipPokemons: action.resetSkipPokemonsTo,
        hasNextPage: !_.isEmpty(next)
      }
    }
    case 'FETCH_MORE_SUCCESS': {
      // Fetched pokemons cannot be empty [] because we check hasNextPage before fetching
      // Therefore, no need to check isEmpty(pokemons)
      const { count, next, previous, results } = action.payload
      const morePokemons = results
      return {
        ...state,
        pokemons: [...state.pokemons, ...morePokemons],
        isLoading: false,
        isError: false,
        skipPokemons: state.skipPokemons + results.length,
        hasNextPage: !_.isEmpty(next)
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
 * @param {string} basePokemonAPI URL of the REST API
 * @param {number} firstPagePokemonAmount
 * @param {number} nextPagePokemonAmount
 * @param {number} [distanceFromBottomToFetchNextPage = 0] distance from
 *      the bottom of the page (in px) to trigger infinite scrolling
 * @returns {{ pokemons: Array, isLoading: boolean, isError: boolean }} note that isLoading will
 *      be true not only while fetching the first page but also while fetching
 *      the next page through infinite scrolling
 */
export const useFetchingWithInfiniteScroll = (
  basePokemonAPI,
  firstPagePokemonAmount,
  nextPagePokemonAmount,
  distanceFromBottomToFetchNextPage = 0
) => {
  const isFetchingNextPage = useRef(false)
  const [state, dispatch] = useReducer(reducer, {
    pokemons: [],
    isLoading: false,
    isError: false,
    skipPokemons: firstPagePokemonAmount,
    hasNextPage: false
  })

  // Fetch pokemons of the first page
  useEffect(() => {
    const FIRST_PAGE_QUERY = `${basePokemonAPI}?limit=${firstPagePokemonAmount}`

    const fetchFirstPage = async () => {
      dispatch({ type: 'FETCH_START' })
      try {
        const response = await axios.get(FIRST_PAGE_QUERY)
        dispatch({
          type: 'FETCH_FIRST_PAGE_SUCCESS',
          payload: _.get(response, 'data', {}),
          resetSkipPokemonsTo: firstPagePokemonAmount
        })
      } catch (e) {
        console.log(`Error when trying to fetch pokemons by ${FIRST_PAGE_QUERY}`, e)
        dispatch({ type: 'FETCH_FAIL' })
      }
    }

    fetchFirstPage()
  }, [basePokemonAPI, firstPagePokemonAmount])

  // (Infinite Scroll) Fetch next page when scrolling to the bottom of the previous page
  useEffect(() => {
    const NEXT_PAGE_QUERY = `${basePokemonAPI}?limit=${nextPagePokemonAmount}&offset=${
      state.skipPokemons
    }`

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
        console.log(`Error when trying to fetch more pokemon from ${NEXT_PAGE_QUERY}`, e)
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
    basePokemonAPI,
    distanceFromBottomToFetchNextPage,
    nextPagePokemonAmount,
    state.hasNextPage,
    state.skipPokemons
  ])

  return {
    pokemons: state.pokemons,
    isLoading: state.isLoading,
    isError: state.isError
  }
}
