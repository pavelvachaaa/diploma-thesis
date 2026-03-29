#let doc(inner, argument_name, explanations) = {
  inner.doc = (argname: argument_name, expl: explanations)
  inner
}

#let type_primitive(id, name, cs_name, en_name) = {
  (type: "primitive", type_id: id, type_name: name, primitive_expl: (cs: cs_name, en: en_name))
}

#let int = type_primitive("integer", "an 'integer'", "celé číslo", "a whole number");
#let float = type_primitive("float", "a 'float'", "desetinné číslo", "a decimal number");
#let bool = type_primitive("boolean", "a 'boolean'", "pravdivostní hodnota", "a truthiness value");
#let string = type_primitive("string", "a 'string'", "textový řetězec", "a text string");
#let cont = type_primitive(
  "content",
  "a 'content'",
  "obsah generovaný Typst syntaxí",
  "content generated with Typst syntax",
);
#let null = type_primitive("none", "a 'none'", "prázdná hodnota", "empty value");

#let literal(value) = {
  (type: "literal", value: value)
}

#let variants(..variants) = {
  (type: "variants", variants: variants.pos())
}

#let slice(items) = {
  (type: "slice", items: items)
}

#let tuple(..items) = {
  (type: "tuple", items: items.pos())
}

#let keyval(key, val) = {
  (type: "keyval", key: key, val: val)
}

#let dict(keyval) = {
  (type: "dictionary", key: keyval.key, val: keyval.val)
}

#let struct(..keyvals) = {
  let copy_doc(from, to) = {
    if "doc" in from {
      let to = to
      to.doc = from.doc
      to
    } else {
      to
    }
  }

  let keyvals = keyvals.pos()
  let res = ().to-dict()
  for keyval in keyvals {
    if keyval.key.type != "literal" {
      panic("invalid type signature, struct keys must be literals")
    }
    res.insert(keyval.key.value, copy_doc(keyval, keyval.val))
  }
  (type: "struct", pairs: res)
}

#let dbg_literal(literal, is_content: false) = {
  let res = if type(literal) == str {
    "\"" + literal + "\""
  } else {
    "'" + str(literal) + "'"
  }
  if is_content {
    raw(res)
  } else {
    res
  }
}

#let dbg_type(value) = {
  str(type(value))
}

#let signature_check(value, signature, name_prefix) = {
  let error_target_name(target, name_prefix) = {
    name_prefix + if "doc" in target { " ('" + target.doc.argname + "')" } else { "" }
  }

  let error_value_name(value) = {
    str(type(value))
  }

  let error_expected_type(target) = {
    if target.type == "variants" {
      let variants = target.variants
      let last = variants.pop()
      let res = (variants.map(v => { error_expected_type(v) })).join(", ")
      if type(last) != type(none) {
        if type(res) != type(none) {
          res + " or " + error_expected_type(last)
        } else {
          error_expected_type(last)
        }
      } else {
        res
      }
    } else if target.type == "slice" or target.type == "tuple" {
      "an array"
    } else if target.type == "dictionary" or target.type == "struct" {
      "a dictionary/hashmap"
    } else if target.type == "primitive" {
      target.type_name
    } else if target.type == "literal" {
      dbg_literal(target.value)
    } else {
      panic()
    }
  }

  let error(target, name_prefix, value, is_value: false, target_doc: none) = {
    (
      if type(target_doc) != type(none) {
        error_target_name(target_doc)
      } else {
        error_target_name(target, name_prefix)
      }
        + (
          " of type '"
            + dbg_type(value)
            + "' is unexpected, expected "
            + error_expected_type(target)
        )
    )
  }

  let in_variants(value, variants, matcher) = {
    for variant in variants {
      if matcher(value, variant).at(0) == true {
        return true
      }
    }
    false
  }

  let opt_suffix(prefix, suffix: " ") = {
    if prefix.len() == 0 {
      ""
    } else {
      prefix + suffix
    }
  }

  let matches_type(value, target, name_prefix: "") = {
    if target.type == "variants" {
      return if in_variants(value, target.variants, matches_type.with(name_prefix: name_prefix)) {
        (true,)
      } else {
        (false, error(target, name_prefix, value, is_value: true))
      }
    } else if target.type == "literal" {
      return if value != target.value {
        (false, error(target, name_prefix, value, is_value: true))
      } else {
        (true,)
      }
    }
    if type(value) == dictionary {
      if target.type == "struct" {
        for key in target.pairs.keys() {
          if key not in value {
            return (
              false,
              (
                error_target_name(target, name_prefix)
                  + " is missing an entry for key "
                  + dbg_literal(key)
              ),
            )
          }
        }
        for (key, val) in value.pairs() {
          if key not in target.pairs {
            return (
              false,
              opt_suffix(name_prefix) + "contains an unexpected key " + dbg_literal(key),
            )
          }
          let res = matches_type(
            val,
            target.pairs.at(key),
            name_prefix: opt_suffix(name_prefix) + str(key),
          )
          if not res.at(0) {
            return res
          } else {
            res
          }
        }
      } else if target.type == "dictionary" {
        for (key, val) in value.pairs() {
          let cur = matches_type(key, target.key, name_prefix: opt_suffix(name_prefix) + "key")
          if not cur.at(0) {
            return cur
          }
          let cur = matches_type(val, target.val, name_prefix: opt_suffix(name_prefix) + "value")
          if not cur.at(0) {
            return cur
          }
        }
        (true,)
      } else {
        (false, error(target, name_prefix, value))
      }
    } else if type(value) == array {
      if target.type == "slice" {
        for (idx, val) in value.enumerate() {
          let cur = matches_type(
            val,
            target.items,
            name_prefix: opt_suffix(name_prefix) + "item at index " + str(idx),
          )
          if not cur.at(0) {
            return cur
          }
        }
        (true,)
      } else if target.type == "tuple" {
        for (idx, target) in target.items.enumerate() {
          if idx >= value.len() {
            return (
              false,
              opt_suffix(name_prefix) + "is missing an item: " + error_expected_type(target),
            )
          }
          let cur = matches_type(
            value.at(idx),
            target,
            name_prefix: opt_suffix(name_prefix) + "item at index " + str(idx),
          )
          if not cur.at(0) {
            return cur
          }
        }
        (true,)
      } else {
        (false, error(target, name_prefix, value))
      }
    } else {
      if target.type != "primitive" or str(type(value)) != target.type_id {
        (false, error(target, name_prefix, value))
      } else {
        (true,)
      }
    }
  }

  matches_type(value, signature, name_prefix: name_prefix)
}

#let signature_docs(target, is_nested: false, lang: "en") = {
  let lang_expr = (
    with_keys: (cs: "S klíči", en: "With keys"),
    with_values: (cs: "S hodnotami", en: "With values"),
    empty: (cs: [prádzné (_none_)], en: [empty (_none_)]),
    struct: (
      cs: [slovník s přesnými atributy (_dictionary_)],
      en: [a dictionary with exact atributes (_dictionary_)],
    ),
    dict: (cs: [slovník (_dictionary_)], en: [_dictionary_]),
    slice: (cs: [pole různé délky (_array_): ], en: [variable-length array (_array_): ]),
    tuple: (cs: [pole s přesnými prvky (_array_): ], en: [array with exact items (_array_): ]),
  )

  let typeinfo(target, flatten: false, disable_doc: false) = {
    let try_doc(target, mapper: v => { v }) = {
      if "doc" in target and not disable_doc {
        mapper(target.doc.expl.at(lang))
      } else {
        ""
      }
    }

    if target.type == "struct" {
      if not flatten {
        lang_expr.struct.at(lang)
        try_doc(target, mapper: v => {
          [ -- ]
          v
        })
        ":"
      }
      list(..target
        .pairs
        .pairs()
        .map(((key, val)) => {
          raw(key)
          try_doc(val, mapper: v => {
            [ -- ]
            text(v)
          })
          ": "
          typeinfo(val, disable_doc: true)
        }))
    } else if target.type == "dictionary" {
      lang_expr.struct.at(lang)
      try_doc(target, mapper: v => {
        [ -- ]
        v
      })
      ":"
      list(
        {
          lang_expr.with_keys.at(lang) + ": "
          typeinfo(target.key)
        },
        {
          lang_expr.with_values.at(lang) + ": "
          typeinfo(target.val)
        },
      )
    } else if target.type == "slice" {
      try_doc(target, mapper: v => {
        v
        ": "
      })
      lang_expr.slice.at(lang)
      typeinfo(target.items, disable_doc: true)
    } else if target.type == "tuple" {
      try_doc(target, mapper: v => {
        v
        ": "
      })
      lang_expr.tuple.at(lang)
      list(..target.items.map(v => {
        list.item({
          typeinfo(v)
        })
      }))
    } else if target.type == "primitive" {
      if target.type_id == "none" {
        lang_expr.empty.at(lang)
        try_doc(target, mapper: v => {
          [ -- ]
          text(v)
        })
      } else {
        text(target.primitive_expl.at(lang) + " (")
        text(target.type_id, style: "italic")
        text(")")
        try_doc(target, mapper: v => {
          [ -- ]
          text(v)
        })
      }
    } else if target.type == "variants" {
      try_doc(target, mapper: v => {
        text(v)
        ":"
      })
      list(..target.variants.map(v => {
        list.item({
          typeinfo(v)
        })
      }))
    } else if target.type == "literal" {
      dbg_literal(target.value, is_content: true)
      try_doc(target, mapper: v => {
        [ -- ]
        text(v)
      })
    } else {
      panic()
    }
  }

  let args = ()
  if target.type == "struct" {
    for val in target.pairs.values() {
      args.push(signature_docs(val, is_nested: true, lang: lang))
    }
  } else {
    if "doc" in target and type(target.doc.argname) != type(none) {
      args.push({
        raw(target.doc.argname)
        [ -- ]
        typeinfo(target)
      })
    }
  }

  if not is_nested {
    list(spacing: 2em, ..args.flatten())
  } else {
    args.flatten()
  }
}
