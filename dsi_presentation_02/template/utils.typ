#let join(a, b) = {
  let res = ();
  if type(a) == array {
    for a in a {
      res.push(a);
    }
  } else {
    res.push(a);
  }
  if type(b) == array {
    for b in b {
      res.push(b);
    }
  } else {
    res.push(b);
  }
  res
}

#let serialize_array(arr) = {
  arr.map((v) => { "'" + str(v) + "'" }).join(", ")
}

// Assumes a valid type signature
#let decompose_type_signature(signature) = {
  let parse_variants(raw) = {
    let tmp = "";
    let res = ();
    for char in raw {
      if char == ":" {
        let trimmed = tmp.trim();
        tmp = "";
        if trimmed.len() != 0 {
          res.push(trimmed);
        }
        res.push(":");
      } else if char == "|" {
        let trimmed = tmp.trim();
        tmp = "";
        if trimmed.len() != 0 {
          res.push(trimmed);
        }
      } else {
        tmp += char;
      }
    }
    if tmp.len() != 0 {
      res.push(tmp.trim());
    }
    res
  };
  let parse_groups(raw) = {
    let tmp = "";
    let groups = ();
    let found_nested = false;
    let nested = 0;
    for char in raw {
      if nested == 2 {
        found_nested = true;
      }
      if char == "[" {
        if nested > 0 {
          tmp += char;
        } else {
          groups = join(groups, parse_variants(tmp));
          tmp = "";
          found_nested = false;
        }
        nested += 1;
      } else if char == "]" {
        if nested > 1 {
          tmp += char;
        } else {
          groups.push(if found_nested { parse_groups(tmp) } else { parse_variants(tmp) });
          tmp = "";
          found_nested = false;
        }
        nested -= 1;
      } else {
        tmp += char;
      }
    }
    if tmp.len() != 0 {
      groups = join(groups, parse_variants(tmp));
    }
    groups
  };
  let parse_nested(grouped) = {
    if type(grouped) != array or grouped.len() == 0 {
      return grouped;
    }
    let first = grouped.at(0);
    if type(first) == str and first == "dictionary" {
      let body = grouped.at(1);
      let key = ();
      for group in body {
        if group == ":" {
          break;
        }
        key.push(group);
      }
      let val = body.slice(key.len() + 1);
      join((("dictionary", parse_nested(key), parse_nested(val)),), parse_nested(grouped.slice(2)))
    } else if type(first) == str and first == "array" {
      join((("array", parse_nested(grouped.at(1))),), parse_nested(grouped.slice(2)))
    } else {
      join(parse_nested(first), parse_nested(grouped.slice(1)))
    }
  };
  let grouped = parse_groups(signature);
  parse_nested(grouped)
}

#let serialize_type_signature(value) = {
  let serialize_type(value, array_serializer, dict_serializer) = {
    if type(value) == dictionary {
      dict_serializer(value, array_serializer)
    } else if type(value) == array {
      array_serializer(value)
    } else {
      str(type(value))
    }
  }

  let serialize_multi_type(values, array_serializer, dict_serializer) = {
    let signatures = ().to-dict();
    for value in values {
      signatures.insert(serialize_type(value, array_serializer, dict_serializer), none);
    }
    signatures.keys().join(" | ")
  }

  let serialize_dict_type(dict, array_serializer) = {
    (
      "dictionary[" +
      serialize_multi_type(dict.keys(), array_serializer, serialize_dict_type) +
      " : " +
      serialize_multi_type(dict.values(), array_serializer, serialize_dict_type) +
      "]"
    )
  }

  let serialize_array_type(arr) = {
    "array[" + serialize_multi_type(arr, serialize_array_type, serialize_dict_type) + "]"
  }

  serialize_type(value, serialize_array_type, serialize_dict_type);
}

#let is_subset_of(subset, of) = {
  let has_value(value, target, matcher) = {
    for target in target {
      if matcher(value, target) {
        return true;
      }
    }
    false
  };
  let is_subset(subset, of, matcher) = {
    for item in subset {
      if not has_value(item, of, matcher) and not has_value("any", of, matcher) {
        return false;
      }
    }
    true
  };
  let matches(a, b) = {
    if type(a) == array {
      if a.at(0) != b.at(0) {
        return false;
      }
      let a_type = a.at(0);
      if a_type == "dictionary" {
        is_subset(a.at(1), b.at(1), matches) and is_subset(a.at(2), b.at(2), matches)
      } else if a_type == "array" {
        is_subset(a.at(1), b.at(1), matches)
      } else {
        panic("invalid signature");
      }
    } else if type(a) != array and type(b) != array {
      a == b
    } else {
      false
    }
  };
  is_subset(subset, of, matches)
}


#let assert_in_arr(needle, arr, item_name) = {
  if str(needle) not in arr {
    let panic_message = (
      "unknown " + item_name + " '" + str(needle) + "', expected one of: " + serialize_array(arr)
    );
    panic(panic_message);
  }
}

#let assert_in_dict(needle, dict, item_name) = {
  assert_in_arr(needle, dict.keys(), item_name);
}

#let assert_dict_has(needles, dict, item_name) = {
  for needle in needles {
    if not needle in dict {
      let panic_message = item_name + " does not contain an entry for '" + needle + "'";
      panic(panic_message);
    }
  }
}

#let matches_type(value, expected_types) = {
  return type(value) in expected_types;
}

#let assert_type(value, expected_types, value_name) = {
  if not matches_type(value, expected_types) {
    let panic_message = (
      "unexpected type for " + value_name + " '" + str(type(value)) + "', expected one of: " +
      serialize_array(expected_types)
    );
    panic(panic_message);
  }
}

#let matches_array_type(arr, expected_item_types) = {
  for item in arr {
    if not matches_type(item, expected_item_types) { return false; }
  }
  true
}

#let assert_array_type(arr, expected_types, array_name) = {
  assert_type(arr, (array), array_name);
  for item in arr {
    assert_type(item, expected_types, array_name + " item");
  }
}

#let matches_dict_type(dict, expected_key_types, expected_value_types) = {
  if type(dict) != dictionary {
    return false;
  }
  for (key, value) in dict.pairs() {
    if not (matches_type(key, expected_key_types) and matches_type(value, expected_value_types)) {
      return false;
    }
  }
  true
}

#let assert_dict_type(dict, expected_key_types, expected_value_types, dict_name) = {
  assert_type(dict, (dictionary), dict_name);
  for (key, value) in dict.items() {
    assert_type(key, expected_key_types, dict_name + " key");
    assert_type(value, expected_value_types, dict_name + " value");
  }
}

#let assert_type_signature(value, expected_type_signature, value_name) = {
  let type_signature = serialize_type_signature(value);
  if not is_subset_of(
    decompose_type_signature(type_signature),
    decompose_type_signature(expected_type_signature)
  ) {
    let panic_message = (
      "unexpected " + value_name + " type '" + type_signature +
      "' expected at least a subset of '" + expected_type_signature + "'"
    );
    panic(panic_message);
  }
}

#let is_none(thing) = {
  if type(thing) == type(none) {
    true
  } else {
    false
  }
}

#let assert_not_none(thing, item_name) = {
  if is_none(thing) {
    let panic_message = "missing " + item_name;
    panic(panic_message);
  }
}

#let ok_or(thing, fallback) = {
  if is_none(thing) {
    fallback
  } else {
    thing
  }
}

#let has_all_none(arr) = {
  for item in arr {
    if not is_none(item) {
      return false;
    }
  }
  true
}

#let map_none(value, mapper) = {
  if is_none(value) {
    return none;
  }
  mapper(value)
}

#let deref(arr) = {
  if arr.len() == 0 {
    arr.at(0)
  } else {
    arr
  }
}
