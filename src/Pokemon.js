import styled from 'styled-components'
import axios from 'axios'
import React, { useEffect, useState } from 'react'

const StyledCard = styled.div`
  background-color: #eee;
  width: 150px;
  padding: 10px;
  margin-bottom: 10px;
`

const StyledName = styled.div`
  color: #444;
  &::first-letter {
    text-transform: uppercase;
    font-weight: bold;
  }
`

const StyledImgWrapper = styled.div`
  height: 150px;
`

const StyledImg = styled.img`
  height: 100%;
`

const Pokemon = props => {
  const { name, url } = props
  const [picURL, setPicURL] = useState('')

  useEffect(() => {
    const fetchPokemonDetail = async () => {
      try {
        const { data } = await axios.get(url)
        setPicURL(data.sprites.front_default)
      } catch (e) {
        console.log('Error when fetching pokemon details', e)
      }
    }

    fetchPokemonDetail()
  }, [url])

  return (
    <StyledCard>
      <StyledName>{name}</StyledName>
      <StyledImgWrapper>
        <StyledImg src={picURL} alt={name} />
      </StyledImgWrapper>
    </StyledCard>
  )
}

export default Pokemon
