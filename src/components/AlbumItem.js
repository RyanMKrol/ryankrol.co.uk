import React, { Component } from 'react'

import './AlbumItem.css';

class AlbumItem extends Component {
  constructor(props) {
    super()

    this.artist = props.artist
    this.albumName = props.albumName
    this.thumbnail = props.thumbnail
    this.albumLink = props.albumLink
    this.playcount = props.playcount

    if (!(this.artist && this.albumName && this.thumbnail && this.albumLink && this.playcount)) {
      throw new Error('Did not pass all required args for rendering AlbumItem')
    }
  }

  render() {
    return (
      <div className="AlbumItem">
        <div className="album-item-thumbnail">
          <a href={this.albumLink}>
            <img
              className="album-item-image"
              src={this.thumbnail}
              alt={`${this.artist} - ${this.albumName}`}
            />
          </a>
        </div>
        <div className="album-information">
          <p className="album-information-content">
            <span className="album-information-key">Artist - </span>
            <span className="album-information-value">{this.artist}</span><br />
            <span className="album-information-key">Album - </span>
            <span className="album-information-value">{this.albumName}</span><br />
            <span className="album-information-key">Plays - </span>
            <span className="album-information-value">{this.playcount}</span>
          </p>
        </div>
      </div>
    )
  }
}

export default AlbumItem
