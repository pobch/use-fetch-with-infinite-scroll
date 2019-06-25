import styled from 'styled-components'
import _ from 'lodash'
import React from 'react'
import Pokemon from './Pokemon'
import { useFetchingWithInfiniteScroll } from './useFetchingWithInfiniteScroll'

/**----------------------------------------------
 * STYLES
 ------------------------------------------------*/
const StyledFlexContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`

const StyledLoading = styled.div`
  width: 100%;
  margin-top: 20px;
  padding: 7px;
  background-color: salmon;
  color: white;
  text-align: center;
`

/**----------------------------------------------
 * MAIN COMPONENT
 ------------------------------------------------*/
const App = props => {
  const { pokemons, isLoading, isError } = useFetchingWithInfiniteScroll(
    'https://pokeapi.co/api/v2/pokemon',
    12,
    7,
    5
  )

  if (isLoading && _.isEmpty(pokemons)) {
    return <StyledLoading>Page is Loading ...</StyledLoading>
  }
  return (
    <StyledFlexContainer>
      <h1>Pika, Pika!</h1>
      {pokemons.map(overviewData => (
        <Pokemon key={overviewData.name} name={overviewData.name} url={overviewData.url} />
      ))}
      {isLoading && <StyledLoading>Loading ...</StyledLoading>}
    </StyledFlexContainer>
  )
}

export default App
