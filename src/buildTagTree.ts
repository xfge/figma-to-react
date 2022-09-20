import { UnitType } from './buildSizeStringByUnit'
import { getCssDataForTag } from './getCssDataForTag'
import { isImageNode } from './utils/isImageNode'

import { Tag } from './types'
import { parseFigmaNode } from './parser/nodeParser'

export function buildTagTree(node: SceneNode, unitType: UnitType): Tag | null {
  if (!node.visible) {
    return null
  }

  const isImg = isImageNode(node)

  const tag: Tag = {
    name: isImg ? 'img' : node.name,
    isText: node.type === 'TEXT',
    textCharacters: node.type === 'TEXT' ? node.characters : null,
    isImg,
    css: getCssDataForTag(node, unitType),
    properties: [], // initial value, will be overwritten if necessary
    children: !isImg ? getChildTags(node, unitType) : [],
    node: node,
    fluentType: undefined, // initial value, will be overwritten if necessary
    variables: {} // initial value, will be overwritten if necessary
  }

  if (isImg) {
    tag.properties.push({ name: 'src', value: '' })
  }

  parseFigmaNode(node, tag)

  return tag
}

const getChildTags = (node: SceneNode, unitType: UnitType): Tag[] => {
  const childTags: Tag[] = []
  if ('children' in node) {
    node.children.forEach((child) => {
      const childTag = buildTagTree(child, unitType)
      if (childTag) {
        childTags.push(childTag)
      }
    })
  }
  return childTags
}
