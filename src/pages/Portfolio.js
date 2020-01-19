import React from 'react'

import { PortfolioItem } from './../components'
import { PORTFOLIO_ITEM_CONTENT } from './../data/PortfolioData'

import './Portfolio.css'

function generatePortfolioItems() {
  return PORTFOLIO_ITEM_CONTENT.map((item) =>
    <PortfolioItem
      key={item.portfolioHeader}
      portfolioMedia={item.portfolioMedia}
      portfolioDescription={item.portfolioDescription}
      portfolioHeader={item.portfolioHeader}
      portfolioItemLink={item.portfolioItemLink}
      portfolioItemTags={item.portfolioItemTags}
    />
  )
}

function Portfolio() {
  return (
    <div className="page-body">
      <div className="Portfolio">
        {generatePortfolioItems()}
      </div>
    </div>
  )
}

export default Portfolio
