export const presentationSchema = {
  type: "object",
  additionalProperties: false,
  required: ["id", "title", "slides", "selection"],
  properties: {
    id: { type: "string" },
    title: { type: "string" },
    ownerId: { type: "string" },
    slides: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["id", "background", "elements"],
        properties: {
          id: { type: "string" },
          name: { type: "string" },
          background: {
            oneOf: [
              {
                type: "object",
                additionalProperties: false,
                required: ["kind", "value"],
                properties: {
                  kind: { const: "color" },
                  value: { type: "string" },
                },
              },
              {
                type: "object",
                additionalProperties: false,
                required: ["kind", "src"],
                properties: {
                  kind: { const: "image" },
                  src: { type: "string" },
                },
              },
              {
                type: "object",
                additionalProperties: false,
                required: ["kind"],
                properties: {
                  kind: { const: "none" },
                },
              },
            ],
          },
          elements: {
            type: "array",
            items: {
              oneOf: [
                {
                  type: "object",
                  additionalProperties: false,
                  required: [
                    "id",
                    "kind",
                    "content",
                    "fontSize",
                    "fontFamily",
                    "color",
                    "position",
                    "size",
                  ],
                  properties: {
                    id: { type: "string" },
                    kind: { const: "text" },
                    content: { type: "string" },
                    isRichText: { type: "boolean" },
                    fontSize: { type: "number" },
                    fontFamily: { type: "string" },
                    color: { type: "string" },
                    backgroundColor: { type: ["string", "null"] },
                    borderColor: { type: ["string", "null"] },
                    borderWidth: { type: "number" },
                    textAlign: { enum: ["left", "center", "right"] },
                    bold: { type: "boolean" },
                    italic: { type: "boolean" },
                    underline: { type: "boolean" },
                    position: {
                      type: "object",
                      additionalProperties: false,
                      required: ["x", "y"],
                      properties: {
                        x: { type: "number" },
                        y: { type: "number" },
                      },
                    },
                    size: {
                      type: "object",
                      additionalProperties: false,
                      required: ["width", "height"],
                      properties: {
                        width: { type: "number" },
                        height: { type: "number" },
                      },
                    },
                  },
                },
                {
                  type: "object",
                  additionalProperties: false,
                  required: ["id", "kind", "src", "position", "size"],
                  properties: {
                    id: { type: "string" },
                    kind: { const: "image" },
                    src: { type: "string" },
                    position: {
                      type: "object",
                      additionalProperties: false,
                      required: ["x", "y"],
                      properties: {
                        x: { type: "number" },
                        y: { type: "number" },
                      },
                    },
                    size: {
                      type: "object",
                      additionalProperties: false,
                      required: ["width", "height"],
                      properties: {
                        width: { type: "number" },
                        height: { type: "number" },
                      },
                    },
                  },
                },
              ],
            },
          },
        },
      },
    },
    selection: {
      type: "object",
      additionalProperties: false,
      required: ["elementIds"],
      properties: {
        slideId: { type: ["string", "null"] },
        elementIds: {
          type: "array",
          items: { type: "string" },
        },
      },
    },
  },
} as const;
