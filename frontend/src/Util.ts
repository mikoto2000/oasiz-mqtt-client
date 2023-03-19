export const serializeContext = (obj: any) => {
  return JSON.stringify(obj, (k, v) => {
      if (v instanceof Map) {
        return {
          dataType: 'Map',
          value: [...v]
        }
      }
      return v;
    })
}

export const deserializeContext : any = (json: string) => {
    return JSON.parse(json, (k, v) => {
      if (typeof v === "object" && v !== null) {
        if (v.dataType === "Map") {
          return new Map(v.value)
        }
      }
      return v;
    })
}

