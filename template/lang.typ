#import "utils.typ": assert_in_dict, assert_in_arr, map_none, ok_or

#let lang_ids = (
  cs: 0,
  en: 1,
);

#let lang_id(lang_abbr) = {
  assert_in_dict(lang_abbr, lang_ids, "language abbreviation");
  return lang_ids.at(lang_abbr);
};

// Typst will usually cache this - so we don't have to re-read the file each time
#let fetch_lang_items() = {
  return json("lang.json");
}

#let get_lang_item(lang_abbr, item_name) = {
  assert_in_dict(lang_abbr, lang_ids, "language abbreviation");
  let lang_items = fetch_lang_items();
  return lang_items.at(lang_abbr).at(item_name);
}

#let replace_czech_gender(raw, gender) = {
  let genders = (
    feminine: 1,
    masculine: 0,
    we: 2,
  );
  assert_in_dict(gender, genders, "author gender");
  raw.replace(regex("\{g:([^|]*)\|([^|]*)\|([^}]*)\}"), (match) => {
    match.captures.at(genders.at(gender))
  });
}

#let replace_english_pronounce(raw, pronounce) = {
  let pronounce = ok_or(pronounce, "me");
  let pronouns = (
    me: 0,
    we: 1,
  );
  assert_in_dict(pronounce, pronouns, "author gender");
  raw.replace(regex("\{g:([^|]*)\|([^}]*)\}"), (match) => {
    match.captures.at(pronouns.at(pronounce))
  });
}

#let set_czech_nonbreakable_terms(content) = {
  let rules = get_lang_item("cs", "break_rules");
  let space_after = rules.at("space_after");
  let nonbreaking_terms = rules.at("nonbreaking_terms");

  let terms = "\b(" + nonbreaking_terms.join("|") + ")";
  let chain = (
    "\b((" + space_after.join("|") + ") )+" +
    "(" + terms + "|\w+\b)"
  );

  let apply_rules(exprs: ("",), content) = {
    let res = content;
    for expr in exprs {
      res = {
        show regex(expr): box;
        res;
      };
    }
    res
  }

  show heading: apply_rules.with(exprs: (chain, terms));
  show par: apply_rules.with(exprs: (chain, terms));
  content
}

#let disclaimer(language, document_type, author_pronouns) = {
  let disclaimer = get_lang_item(language, "disclaimer_content");
  let replacements = get_lang_item(language, "disclaimer_replace").at(document_type);
  if language == "cs" {
    disclaimer = replace_czech_gender(disclaimer, author_pronouns);
  } else if language == "en" {
    disclaimer = replace_english_pronounce(disclaimer, author_pronouns);
  }
  for (key, value) in replacements.pairs() {
    disclaimer = disclaimer.replace("{" + key + "}", value);
  }
  if disclaimer.contains("{") or disclaimer.contains("}") {
    panic("invalid language file");
  }
  disclaimer
}
