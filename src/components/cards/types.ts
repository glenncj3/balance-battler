export interface CardItem {
  id: string
  name: string
  rarity: string
  cardType: string
  imageUrl: string
  thumbnailSm?: string
  thumbnailLg?: string
  eloRating?: number
}

export interface CardPreviewData {
  id: string
  name: string
  rarity: string
  cardType: string
  imageUrl: string
  eloRating?: number
}
