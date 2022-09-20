import { CSSData } from './getCssDataForTag'
import { FluentComponentType } from './fluentTypes'

export type Property = {
  name: string
  value: string | null
  notStringValue?: boolean
}

export type Tag = {
  name: string
  isText: boolean
  textCharacters: string | null
  isImg: boolean
  properties: Property[]
  css?: CSSData
  children: Tag[]
  node: SceneNode
  isComponent?: boolean
  fluentType?: FluentComponentType
  variables: { [key: string]: string }
}
