#import "../arguments.typ": req_arg
#import "../utils.typ": assert_dict_has, is_none
#import "../theme.typ": faculty_color, faculty_logotype, faculty_logotype_text, tul_logomark
#import "../lang.typ": get_lang_item
#import "common.typ": base_font, bibliogr, common_styling, merge_authors

#let header_margin = 20pt
#let footer_margin = header_margin

#let paper_compensation = (
  presentation-4-3: 1.2570145903479237,
  presentation-16-9: 1,
)

#let set_page_style(lang, faculty, faculty_color, paper, content) = {
  context {
    let footer_logotype = faculty_logotype(faculty, lang, long: false)
    let footer_height = measure(footer_logotype).height + footer_margin * 2
    set page(paper: paper, margin: (bottom: footer_height, rest: 1cm), footer-descent: 0%, footer: {
      v(footer_margin)
      text(
        box(outset: (top: footer_margin, bottom: footer_margin), {
          footer_logotype
          h(1fr)
          context text(
            str(counter(page).get().at(0)) + " / " + str(counter(page).final().at(0)),
            font: "TUL Mono",
            faculty_color,
          )
        }),
        size: 11pt,
      )
    })
    set text(size: 1.5em * paper_compensation.at(paper))
    content
  }
}

#let set_heading_styles(first_heading_is_fullpage, faculty_color, content) = {
  let slide_title = it => {
    pagebreak(weak: true)
    box(it, inset: (top: 1em, bottom: 1em))
  }
  show heading.where(level: 1): it => {
    if first_heading_is_fullpage {
      page(place(center + horizon, it), header: none, margin: (top: 0em))
    } else {
      slide_title(it)
    }
  }
  if first_heading_is_fullpage {
    show heading.where(level: 2): it => {
      slide_title(it)
    }
    content
  } else {
    content
  }
}

#let apply_style(language, faculty, faculty_color, paper, first_heading_fullpage, content) = {
  common_styling(
    faculty_color,
    language,
    set_page_style(
      language,
      faculty,
      faculty_color,
      paper,
      set_heading_styles(first_heading_fullpage, faculty_color, content),
    ),
  )
}

#let fullpage(language, faculty, faculty_color, content, paper) = {
  page(
    background: rect(fill: faculty_color, width: 100%, height: 100%),
    paper: paper,
    margin: 1cm,
    {
      grid(
        columns: 3,
        faculty_logotype(faculty, language, color: white), h(1fr), tul_logomark(faculty, color: white),
      )
      content
    },
  )
}

#let signedpage(language, faculty, faculty_color, author, content, paper) = {
  let author = merge_authors(author).at(0)
  fullpage(
    language,
    faculty,
    faculty_color,
    {
      content
      place(center + bottom, text(author, white.transparentize(10%), size: 1.5em, font: base_font))
    },
    paper,
  )
}

#let mainpage(language, faculty, faculty_color, title, author, supervisor, paper) = {
  signedpage(
    language,
    faculty,
    faculty_color,
    author,
    {
      place(center + horizon, {
        text(
          title,
          size: 2em * paper_compensation.at(paper),
          font: "TUL Mono",
          white,
        )

        let label = get_lang_item(language, "supervisor")

        if supervisor != none {
          v(1em)
          text(
            label + ": " + supervisor,
            size: 1.2em * paper_compensation.at(paper),
            font: base_font,
            white,
          )
        }
      })
    },
    paper,
  )
}

#let thankspage(language, faculty, faculty_color, author, paper) = {
  let author_multiple = merge_authors(author).at(1)
  signedpage(
    language,
    faculty,
    faculty_color,
    author,
    {
      place(center + horizon, text(
        get_lang_item(
          language,
          "thanks_for_attention" + if author_multiple { "_plural" } else { "" },
        ),
        size: 2em * paper_compensation.at(paper),
        font: "TUL Mono",
        white,
      ))
    },
    paper,
  )
}

#let presentation(args, content) = {
  let language = req_arg(args, "document.language")
  let faculty = req_arg(args, "document.faculty")
  let faculty_color = faculty_color(faculty)
  let presentation_args = req_arg(args, "presentation_info")
  let author = req_arg(args, "author.name")

  let supervisor = args.at("project", default: (:)).at("supervisor", default: none)
  let first_heading_is_fullpage = presentation_args.at("first_heading_is_fullpage")
  let paper = if presentation_args.at("wide") {
    "presentation-16-9"
  } else {
    "presentation-4-3"
  }

  mainpage(
    language,
    faculty,
    faculty_color,
    req_arg(args, "title").at(language),
    author,
    supervisor,
    paper,
  )
  apply_style(language, faculty, faculty_color, paper, first_heading_is_fullpage, {
    content
    bibliogr(args, presentation_double_title: first_heading_is_fullpage)
  })
  if presentation_args.at("append_thanks") {
    thankspage(language, faculty, faculty_color, author, paper)
  }
}
