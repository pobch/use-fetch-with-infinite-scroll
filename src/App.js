import styled from 'styled-components'
import _ from 'lodash'
import React from 'react'
import Pokemon from './Pokemon'
import { useFetchingWithInfiniteScroll } from './useFetchingWithInfiniteScroll'

const StyledFlexContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`

const App = props => {
  const { pokemons, isLoading, isError } = useFetchingWithInfiniteScroll(
    'https://pokeapi.co/api/v2/pokemon',
    12,
    7,
    10
  )

  if (isLoading && _.isEmpty(pokemons)) {
    return <div>Page is Loading ...</div>
  }
  return (
    <StyledFlexContainer>
      <h1>Pika, Pika !</h1>
      {pokemons.map(overviewData => (
        <Pokemon key={overviewData.name} name={overviewData.name} url={overviewData.url} />
      ))}
      {isLoading && <div>Next Page is Loading ...</div>}
    </StyledFlexContainer>
  )
}

export default App
