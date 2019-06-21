import axios from 'axios'
import React, { useEffect, useState } from 'react'

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
    <React.Fragment>
      <div>{name}</div>
      <div>
        <img src={picURL} alt={name} />
      </div>
    </React.Fragment>
  )
}

export default Pokemon
