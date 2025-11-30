#import "../theme.typ": faculty_logotype, tul_logomark, faculty_color
#import "../lang.typ": get_lang_item, set_czech_nonbreakable_terms
#import "../utils.typ": is_none, assert_dict_has, has_all_none, map_none
#import "../arguments.typ": req_arg, get_arg

#let base_font = "Inter";
#let mono_font = "Noto Sans Mono";
#let serif_font = "Merriweather";
#let tul_logomark_size = 6.5em;

// COUNTERS

#let image_count = counter("image_count");
#let table_count = counter("table_count");

// TYPST ELEMENT STYLING

#let default_styling(flip_bonding, faculty_color, content, language) = {
  // page
  set page(
    margin: if flip_bonding {
      (inside: 4cm, top: 3cm, bottom: 3cm)
    } else {
      (left: 4cm, top: 3cm, bottom: 3cm)
    },
    numbering: "1", footer: {
    context {
      let page = counter(page).get().at(0);
      if flip_bonding {
        align(str(page), if calc.rem(page, 2) == 1 { right } else { left });
      } else {
        align(str(page), right);
      }
    }
  });

  // text
  set text(font: base_font);
  set par(justify: true);
  if language == "cs" {
    content = set_czech_nonbreakable_terms(content);
  }

  // figures
  let figure_numbering(realcount, c) = {
    context realcount.step();
    context numbering("1. 1", counter(heading).get().at(0), c)
  };
  show figure.where(kind: image): set figure(numbering: figure_numbering.with(image_count));
  show figure.where(kind: table): set figure(numbering: figure_numbering.with(table_count));
  show figure.where(kind: table): set figure.caption(position: top);
  show figure: it => {
    block(it, above: 2em, below: 2em);
  }
  set image(width: 80%);

  // heading
  set heading(numbering: "1.1.1 ");
  show heading: it => {
    set par(justify: false);
    block(
      above: 2em,
      below: 2em,
      text(it, faculty_color, font: "TUL Mono", size: 1.2em)
    );
  };
  show heading.where(level: 1): it => {
    // reset figure counters
    context counter(figure.where(kind: image)).update(0);
    context counter(figure.where(kind: table)).update(0);

    pagebreak(weak: true);
    v(2cm);
    it
  };
  show heading.where(): it => {
    if it.level > 3 {
      panic("maximum allowed heading level is 3");
    } else {
      it
    }
  }

  // other
  show raw.where(block: false): set text(font: mono_font, size: 1.25em);
  show raw.where(block: true): it => {
    block(it, fill: rgb("#eee"), inset: 1em)
  };
  show link: it => {
    if type(it.dest) == label or type(it.dest) == location {
      it;
    } else {
      text(it, fill: faculty_color);
    }
  }
  set highlight(fill: faculty_color.lighten(90%));
  set line(stroke: (paint: faculty_color, thickness: .7pt), length: 100%);

  content
}


#let header(faculty_id, language) = {
  let logotype = faculty_logotype(faculty_id, language);
  grid(
    block(logotype, width: 100%),
    block(align(right, block(tul_logomark(faculty_id), height: tul_logomark_size))),
    columns: 2
  );
}

// DOCUMENT INFO

#let person_info(record, item_name) = {
  if is_none(record) {
    none
  } else if type(record) == str or type(record) == content {
    record
  } else if type(record) == dictionary {
    if "name" in record {
      record.at("name");
      if "institute" in record {
        text("\n    " + record.at("institute"), style: "italic")
      }
    } else {
      let panic_message = (
        item_name + " name is required (or try not specifying " + item_name + " at all)"
      );
      panic(panic_message);
    }
  } else {
    let panic_message = "invalid " + item_name + " - expected a string or a dictionary";
    panic(panic_message);
  }
}

#let info_base(
  faculty_id,
  language,
  display_document_type,
  title,
  info_fields,
  show_city: true,
) = {
  let info_name_value_padding = 5em;
  let info_name_min_width = 10em;
  let gutter = .7em;

  // document type
  if display_document_type != "other" and display_document_type != "other_asgn" {
    text(get_lang_item(language, display_document_type), weight: "bold", font: base_font);
    v(0em);
  }

  // title
  text(
    title, weight: "bold", size: 2em,
    faculty_color(faculty_id), font: base_font,
  );
  v(0em);

  context {
    let max_field_name_width = calc.max(..info_fields.map((v) => {
      if type(v.at(1)) == type(none) {
        0pt
      } else {
        measure(get_lang_item(language, v.at(0)) + ":").width
      }
    }), info_name_min_width.to-absolute());
    grid(
      columns: 2,
      gutter: gutter,
      ..info_fields.filter((v) => { type(v.at(1)) != type(none) }).map((v) => {
        (
          align(top, block(
            text(get_lang_item(language, v.at(0)) + ":", style: "italic", font: base_font),
            width: max_field_name_width + info_name_value_padding
          )),
          text(v.at(1), font: base_font, weight: if v.at(2) { "bold" } else { "regular" })
        )
      }).flatten(),
    );
    v(1em);
    h(max_field_name_width + info_name_value_padding + gutter);
    if show_city {
      text(get_lang_item(language, "city") + " " + str(datetime.today().year()), font: base_font);
    }
  }
}

#let info_mainpage(
  faculty_id,
  language,
  document_type,
  title, author, supervisor, consultant, study_programme, study_specialization, year_of_study,
) = {
  info_base(faculty_id, language, document_type, title, (
    ("author", author, true),
    ("supervisor", person_info(supervisor, "supervisor"), false),
    ("consultant", person_info(consultant, "consultant"), false),
    ("study_programme", study_programme, false),
    ("study_specialization", study_specialization, false),
    ("year_of_study", year_of_study, false),
  ));
}

#let info_assignment(
  faculty_id,
  language,
  document_type,
  title, author, personal_number, study_programme, department, academical_year,
) = {
  info_base(faculty_id, language, document_type + "_asgn", title, (
    ("names", author, true),
    ("personal_number", personal_number, false),
    ("study_programme", study_programme, false),
    ("assigning_department", department, false),
    ("academical_year", academical_year, false),
  ), show_city: false);
}

// MAINPAGE

#let mainpage(args) = {
  let (
    language, document_type, faculty,
    title, author, supervisor, consultant, study_programme, study_specialization, year_of_study,
  ) = get_arg(args, (
    "document.language",
    "document.type",
    "document.faculty",
    "title",
    "author.name",
    "project.supervisor",
    "project.consultant",
    "author.programme",
    "author.specialization",
    "author.year_of_study",
  ));
  set text(font: base_font);
  set page(margin: 2cm);
  pagebreak(weak: true);
  if has_all_none((
    document_type, title, author, supervisor, consultant, study_programme,
  )) {
    place(center + horizon, align(left, faculty_logotype(faculty_id, language)));
  } else {
    header(faculty, language);
    align({
      info_mainpage(
        faculty, language, document_type, map_none(title, (v) => v.at(language)),
        author, supervisor, consultant, map_none(study_programme, (v) => v.at(language)),
        map_none(study_specialization, (v) => v.at(language)), year_of_study,
      );
      v(5em);
    }, bottom);
  }
}

#let assignmentpage(args, language, document_type, faculty, title, author, programme, content) = {
  let (personal_number, department, academical_year) = req_arg(args, (
    "personal_number", "department", "academical_year",
  ));
  set heading(bookmarked: false, outlined: false);
  set text(font: base_font);
  set page(margin: 2cm);
  pagebreak(weak: true);
  header(faculty, language);
  info_assignment(
    faculty, language, document_type, title.at(language), author, personal_number,
    programme.at(language), department, academical_year,
  );
  show heading: it => {
    block(it, above: 1em, below: 1em);
  }
  content;
}

// _ EMBEDDED

#let pdfembed(path) = {
  import "../pdf.typ": embed_full
  embed_full(read(path, encoding: none));
}

// ASSIGNMENT PAGE

#let assignment(args, show_fallback: true) = {
  if is_none(get_arg(args, "assignment")) {
    if not show_fallback {
      return;
    }
    page(
      place(center + horizon, text(
        get_lang_item(req_arg(args, "document.language"), "place_assignment"),
        fill: red,
        size: 3em,
        font: base_font,
        weight: "bold",
      )),
      margin: 0em,
      footer: none,
    );
    return;
  }
  let assignment = req_arg(args, "assignment");
  if type(assignment) == str {
    pdfembed(req_arg(args, "assignment"));
  } else if type(assignment) == content {
    req_arg(args, "assignment");
  } else if type(assignment) == dictionary {
    assignmentpage(
      assignment,
      ..req_arg(args, (
        "document.language", "document.type", "document.faculty", "title", "author.name",
        "author.programme",
      )),
      req_arg(assignment, "content"),
    );
  }
}

// EXTERNAL TITLE PAGES

#let external_title_pages(path) = {
  pdfembed(path);
}

// DISCLAIMER PAGE

#let disclaimer(args) = {
  import "../lang.typ": disclaimer
  let (language, faculty, disclaimer_type, author) = req_arg(args, (
    "document.language",
    "document.faculty",
    "document.type",
    "author.name",
  ));
  let author_pronouns = get_arg(args, "author.pronouns");
  heading(get_lang_item(language, "disclaimer"), numbering: none, outlined: false);
  par(
    text(disclaimer(language, disclaimer_type, author_pronouns))
  );
  v(5em);
  grid(
    columns: 2,
    gutter: 1em,
    block(
      text(datetime.today().display(get_lang_item(language, "date")), lang: "cs"), width: 100%
    ),
    text(author),
  );
}

// ACKNOWLEDGEMENT PAGE

#let acknowledgement(args) = {
  let content = get_arg(args, "acknowledgement");
  let (language, author) = req_arg(args, ("document.language", "author.name"));
  if is_none(content) {
    return;
  }
  heading(get_lang_item(language, "acknowledgement"), numbering: none, outlined: false);
  par(content.at(language));
  v(2em);
  align(right, author);
}

// ABSTRACT

#let display_keywords(keywords) = {
  if type(keywords) == array {
    keywords.join(", ")
  } else if type(keywords) == str or type(keywords) == content {
    keywords
  }
}

#let abstract(language, args, require: true) = {
  if not require and is_none(get_arg(args, "abstract.content")) {
    return;
  }
  heading(
    text(req_arg(args, "title").at(language), font: base_font), numbering: none, outlined: false
  );
  v(2em);
  heading(
    level: 2,
    get_lang_item(language, "abstract"),
    numbering: none,
    outlined: false,
  );
  text(req_arg(args, "abstract.content").at(language));
  let keywords = get_arg(args, "abstract.keywords");
  if not is_none(keywords) and type(keywords.at(language)) != type(none) {
    linebreak();
    linebreak();
    text(get_lang_item(language, "keywords") + ": ", weight: "bold", font: base_font);
    display_keywords(keywords.at(language))
  }
}

// _ OUTLINE FIGURE INNER
#let _outline_figure_inner(selector, title, body_mapper) = {
  let entry(selector, element) = {
    link(
      element.location(),
      grid(
        columns: 3,
        gutter: .5em,
        stack(
          dir: ltr,
          text(numbering(
            "1.1",
            counter(heading).at(element.location()).at(0),
            counter(selector).at(element.location()).at(0),
          )),
          h(.5em),
          text(body_mapper(element)),
        ),
        box(repeat([.], gap: 0.15em)),
        str(element.location().page()),
      ),
    )
  }
  heading(title, numbering: none);
  for el in query(figure.where(kind: selector)) {
    if is_none(el.caption) {
      continue;
    }
    entry(figure.where(kind: selector), el);
  }
}

// _ FIGURE OUTLINE

#let _figure_outline(realcount, target, title) = {
  context {
    if realcount.final().at(0) == 0 {
      return;
    }
    _outline_figure_inner(target, title, (it) => it.caption.body);
  }
}

// IMAGE LIST

#let imagelist(language) = {
  _figure_outline(image_count, image, get_lang_item(language, "image_list"));
}

// TABLE LIST

#let tablelist(language) = {
  _figure_outline(table_count, table, get_lang_item(language, "table_list"));
}

// ABBREVIATION LIST

#let abbrlist(language) = {
  import "../abbreviations.typ": abbrlist
  context {
    let abbrs = abbrlist();
    let max_abbr_width = if abbrs.len() > 0 {
      calc.max(abbrs.keys().map((v) => measure(v).width)).at(0)
    } else { return };
    pagebreak(weak: true);
    heading(get_lang_item(language, "abbrs"), numbering: none);
    align(center, grid(
      columns: 2,
      gutter: 1em,
      ..abbrs.pairs().map((a) => {
        (
          align(left, {
            [
              #block(text(a.at(0), weight: "bold"), width: max_abbr_width + 1em)
              #label("abbr_" + a.at(0))
            ]
          }),
          text(a.at(1))
        )
      }).flatten()
    ));
  }
}

// TABLE OF CONTENTS

#let toc(language) = {
  show outline.entry.where(level: 1): it => {
    show repeat: none;
    block(text(it, weight: "bold", size: 1.2em), above: 1.5em);
  };
  context {
    if query(heading.where(outlined: true)).len() > 0 {
      outline(title: get_lang_item(language, "toc"));
    }
  }
}

// BIBLIOGRAPHY

#let bibliogr(args) = {
  let (language, citations_file) = req_arg(args, ("document.language", "citations"));
  let styles = (
    "cs": "../citations/tul-csn690-numeric-square_brackets.csl",
    "en": "../citations/iso690-numeric-square_brackets.csl",
  );
  let style = styles.at(language);
  context {
    if query(ref.where(element: none)).len() > 0 {
      bibliography(
        citations_file,
        style: style,
        title: get_lang_item(language, "bibliography"),
      );
    }
  }
}
