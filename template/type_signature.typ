#let doc(inner, argument_name, explanation) = {
  inner.doc = (argname: argument_name, expl: explanation);
  inner
}

#let type_primitive(id, name, cs_name) = {
  (type: "primitive", type_id: id, type_name: name, type_name_cs: cs_name)
}

#let int = type_primitive("integer", "an 'integer'", "celé číslo");
#let float = type_primitive("float", "a 'float'", "desetinné číslo");
#let bool = type_primitive("boolean", "a 'boolean'", "pravdivostní hodnota");
#let string = type_primitive("string", "a 'string'", "textový řetězec");
#let content = type_primitive("content", "a 'content'", "obsah generovaný Typst syntaxí");

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
      let to = to;
      to.doc = from.doc;
      to
    } else {
      to
    }
  }

  let keyvals = keyvals.pos();
  let res = ().to-dict();
  for keyval in keyvals {
    if keyval.key.type != "literal" {
      panic("invalid type signature, struct keys must be literals");
    }
    res.insert(keyval.key.value, copy_doc(keyval, keyval.val));
  }
  (type: "struct", pairs: res)
}

#let signature_check(value, signature, name_prefix) = {
  let error_target_name(target, name_prefix) = {
    name_prefix + if "doc" in target { " ('" + target.doc.argname + "')" } else { "" }
  }

  let error_value_name(value) = {
    str(type(value))
  }

  let dbg_literal(literal) = {
    if type(literal) == str {
      "\"" + literal + "\""
    } else {
      "'" + str(literal) + "'"
    }
  }

  let error_expected_type(target) = {
    if target.type == "variants" {
      let variants = target.variants;
      let last = variants.pop();
      let res = (variants.map((v) => { error_expected_type(v) })).join(", ");
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
      panic();
    }
  }

  let error(target, name_prefix, value, is_value: false, target_doc: none) = {
    if type(target_doc) != type(none) {
      error_target_name(target_doc)
    } else {
      error_target_name(target, name_prefix)
    } + " " + if is_value {
      "is unexpected"
    } else {
      "has an unexpected type '" + error_value_name(value) + "'"
    } + ", expected " + error_expected_type(target)
  }

  let in_variants(value, variants, matcher) = {
    for variant in variants {
      if matcher(value, variant).at(0) == true {
        return true;
      }
    }
    false
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
            return (false, (
              error_target_name(target, name_prefix) +
              " is missing an entry for key " +
              dbg_literal(key)
            ));
          }
        }
        for (key, val) in value.pairs() {
          if key not in target.pairs {
            return (
              false, name_prefix + " contains an unexpected key " + dbg_literal(key)
            );
          }
          matches_type(
            val, target.pairs.at(key), name_prefix: name_prefix + " " + str(key)
          )
        }
      } else if target.type == "dictionary" {
        for (key, val) in value.pairs() {
          let cur = matches_type(key, target.key, name_prefix: name_prefix + " key");
          if not cur.at(0) {
            return cur;
          }
          let cur = matches_type(
            val, target.val, name_prefix: name_prefix + " value"
          );
          if not cur.at(0) {
            return cur;
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
            val, target.items, name_prefix: name_prefix + " item at index " + str(idx)
          );
          if not cur.at(0) {
            return cur;
          }
        }
        (true,)
      } else if target.type == "tuple" {
        for (idx, target) in target.items.enumerate() {
          if idx >= value.len() {
            return (false, name_prefix + " is missing an item: " + error_expected_type(target))
          }
          let cur = matches_type(
            value.at(idx), target, name_prefix: name_prefix + " item at index " + str(idx)
          );
          if not cur.at(0) {
            return cur;
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

#let signature_docs(target, is_nested: false) = {
  let typeinfo(target, flatten: false, disable_doc: false) = {
    let try_doc(target, mapper: (v) => { v }) = {
      if "doc" in target and not disable_doc {
        mapper(target.doc.expl);
      } else {
        ""
      }
    }

    if target.type == "struct" {
      if not flatten {
        [slovník s přesnými atributy (_dictionary_)];
        try_doc(target, mapper: (v) => { [ -- ]; v; });
        ":";
      }
      list(
        ..target.pairs.pairs().map(((key, val)) => {
          raw(key);
          try_doc(val, mapper: (v) => { [ -- ]; text(v); });
          ": "
          typeinfo(val, disable_doc: true);
        })
      );
    } else if target.type == "dictionary" {
      [slovník (_dictionary_)];
      try_doc(target, mapper: (v) => { [ -- ]; v; });
      ":";
      list(
        {
          "S klíči typu ";
          typeinfo(target.val);
        },
        {
          "S hodnotami typu ";
          typeinfo(target.key);
        },
      );
    } else if target.type == "slice" {

    } else if target.type == "tuple" {

    } else if target.type == "primitive" {
      text(target.type_name_cs + " (");
      text(target.type_id, style: "italic");
      text(")");
      try_doc(target, mapper: (v) => { [ -- ]; text(v); });
    } else if target.type == "variants" {
      list(
        ..target.variants.map((v) => {
          list.item({
            typeinfo(v);
          });
        })
      );
    } else {
      panic();
    }
  }

  let args = ();
  if target.type == "struct" {
    for val in target.pairs.values() {
      args.push(signature_docs(val, is_nested: true));
    }
  } else {
    if "doc" in target and type(target.doc.argname) != type(none) {
      args.push({
        raw(target.doc.argname);
        [: ]
        typeinfo(target, flatten: true)
      });
    }
  }

  if not is_nested {
    list(..args.flatten());
  } else {
    args.flatten()
  }
}
