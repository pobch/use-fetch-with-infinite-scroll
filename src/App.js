import _ from 'lodash'
import React from 'react'
import Pokemon from './Pokemon'
import { useFetchingWithInfiniteScroll } from './useFetchingWithInfiniteScroll'

const App = props => {
  const { pokemons, isLoading, isError } = useFetchingWithInfiniteScroll(
    'https://pokeapi.co/api/v2/pokemon',
    20,
    5
  )

  if (isLoading && _.isEmpty(pokemons)) {
    return <div>Page Loading ...</div>
  }
  return (
    <div>
      <h1>Pika, Pika !</h1>
      {pokemons.map(overviewData => (
        <Pokemon key={overviewData.name} name={overviewData.name} url={overviewData.url} />
      ))}
      {isLoading && <div>Next Page is Loading ...</div>}
    </div>
  )
}

export default App
