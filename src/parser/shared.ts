import {Property, Tag} from "../buildTagTree";
import {capitalizeFirstLetter, smallCamel} from "../utils/stringUtils";

export const parseFigmaVariant = (node: InstanceNode, variantName: string, variantValue: string, properties: Property[], propName: string, propValue: string | null, notStringValue?: boolean) => {
  if (node.variantProperties && node.variantProperties[variantName] === variantValue) {
    properties.push({ name: propName, value: propValue, notStringValue: notStringValue })
  }
}

export const parseCommonFigmaVariants = (node: InstanceNode, properties: Property[]) => {
  parseFigmaVariant(node, 'Disable', 'True', properties, 'disabled', null, true)
}

const getItemString = (properties: Property[]): string => {
  return properties.length > 0 ? `{ ${properties.map(prop => `${prop.name}: ${prop.notStringValue ? '' : '"'}${prop.value}${prop.notStringValue ? '' : '"'},`).join(' ')} },` : ''
}

export const parseFigmaNestedItems = (childTags: Tag[], properties: Property[], propName: string, nodeName: string, variables: {[key: string]: string}) => {
  const optionStrings: string[] = []
  childTags.forEach(childTag => {
    if (childTag.node.type === 'FRAME') {
      childTag.children.forEach((optionTag) => {
        optionStrings.push(getItemString(optionTag.properties))
      })
    } else {
      optionStrings.push(getItemString(childTag.properties))
    }
  })

  const itemsVarName = `${smallCamel(nodeName)}${capitalizeFirstLetter(propName)}`
  properties.push({ name: propName, value: itemsVarName, notStringValue: true})
  variables[itemsVarName] = `[${optionStrings.join(' ')}]`
}