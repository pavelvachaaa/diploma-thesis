#let generate_jumptable(pat) = {
  let jt = ();
  let matched = 0;
  for (idx, item) in pat.enumerate() {
    jt.push(matched);
    if idx != 0 and item == pat.at(matched) {
      matched += 1;
    } else {
      matched = 0;
    }
  }
  jt
}

#let advance(pat, jt, ptr, cur) = {
  if ptr >= pat.len() {
    return ptr;
  }
  if pat.at(ptr) == cur {
    ptr + 1
  } else {
    if ptr == 0 {
      0
    } else {
      advance(pat, jt, jt.at(ptr), cur)
    }
  }
}

#let find(pat, jt, haystack, start_from: 0) = {
  let ptr = 0;
  for idx in range(start_from, haystack.len()) {
    let item = haystack.at(idx);
    ptr = advance(pat, jt, ptr, item);
    if ptr >= pat.len() {
      return idx;
    }
  }
  none
}

#let match(pat, haystack, start_at) = {
  if start_at + pat.len() > haystack.len() {
    return false;
  }
  for idx in range(start_at, start_at + pat.len()) {
    if haystack.at(idx) != pat.at(idx - start_at) {
      return false;
    }
  }
  true
}

#let number_of_pages(haystack) = {
  let pat_type = (47, 84, 121, 112, 101); // "/Type"
  let pat_page = (47, 80, 97, 103, 101); // "/Page"
  let space = 32; // " "
  let ascii_chars = (
    97, 98, 99, 100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115, 116,
    117, 118, 119, 120, 121, 122, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80,
    81, 82, 83, 84, 85, 86, 87, 88, 89, 90
  );
  let jt_type = generate_jumptable(pat_type);

  let skip_spaces(haystack, start_at) = {
    for idx in range(start_at, haystack.len()) {
      let item = haystack.at(idx);
      if item != space {
        return idx;
      }
    }
    none
  }

  let res = 0;
  let ptr = 0;
  while ptr < haystack.len() and type(ptr) != type(none) {
    ptr = find(pat_type, jt_type, haystack, start_from: ptr);
    if type(ptr) == type(none) { break; }
    // Matched: "/Type"
    ptr = skip_spaces(haystack, ptr + 1);
    if type(ptr) == type(none) { break; }
    // Matched: "/Type", spaces
    if not match(pat_page, haystack, ptr) { continue; }
    ptr += pat_page.len();
    // Matched: "/Type", spaces, "/Page"
    if haystack.at(ptr) in ascii_chars { continue; }
    // Matched: "/Type", spaces, "/Page", word_end
    res += 1;
  }

  res
}

#let embed_full(src) = {
  let page_count = number_of_pages(src);
  for idx in range(0, page_count) {
    page(image(src, page: idx + 1), margin: 0cm, footer: none, header: none);
  }
}
