const url = require('url')
const path = require('path')

const {
  GraphQLInt,
  GraphQLJSON,
  GraphQLEnumType
} = require('../../graphql')

const { fieldResolver } = require('../resolvers')
const { SUPPORTED_IMAGE_TYPES } = require('../../../utils/constants')

const imageFitType = new GraphQLEnumType({
  name: 'ImageFit',
  values: {
    cover: {
      value: 'cover',
      name: 'Cover',
      description: 'Crop to cover both provided dimensions.'
    },
    contain: {
      value: 'contain',
      name: 'Contain',
      description: 'Embed within both provided dimensions.'
    },
    fill: {
      value: 'fill',
      name: 'Fill',
      description: 'Ignore the aspect ratio of the input and stretch to both provided dimensions.'
    },
    inside: {
      value: 'inside',
      name: 'Inside',
      description: 'Preserving aspect ratio, resize the image to be as large as possible while ensuring its dimensions are less than or equal to both those specified.'
    },
    outside: {
      value: 'outside',
      name: 'Outside',
      description: 'Preserving aspect ratio, resize the image to be as small as possible while ensuring its dimensions are greater than or equal to both those specified. Some of these values are based on the object-fit CSS property.'
    }
  }
})

exports.isImage = value => {
  if (typeof value === 'string') {
    const ext = path.extname(value).toLowerCase()
    const { hostname, pathname } = url.parse(value)

    if (hostname && pathname === '/') {
      return false
    }

    return SUPPORTED_IMAGE_TYPES.includes(ext)
  }

  return false
}

exports.imageType = {
  type: GraphQLJSON,
  args: {
    width: { type: GraphQLInt, description: 'Width' },
    height: { type: GraphQLInt, description: 'Height' },
    fit: { type: imageFitType, description: 'Fit', defaultValue: 'cover' },
    quality: { type: GraphQLInt, description: 'Quality (default: 75)' },
    blur: { type: GraphQLInt, description: 'Blur level for base64 string' }
  },
  async resolve (obj, args, context, info) {
    const value = fieldResolver(obj, args, context, info)
    let result

    if (!value) return null

    try {
      result = await context.queue.add(value, args)
    } catch (err) {
      return null
    }

    return {
      type: result.type,
      mimeType: result.mimeType,
      src: result.src,
      size: result.size,
      sizes: result.sizes,
      srcset: result.srcset,
      dataUri: result.dataUri
    }
  }
}
