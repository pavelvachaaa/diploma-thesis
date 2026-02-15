// tools & utils
#import "../theme.typ": faculty_color, faculty_logotype, tul_logomark
#import "../lang.typ": get_lang_item, lang_id
#import "../utils.typ": assert_dict_has, assert_in_arr, assert_in_dict, is_none, map_none
#import "../arguments.typ": get_arg, map_arg, req_arg
#import "common.typ": default_styling, external_title_pages

// thesis types
#import "bp.typ": bp
#import "dp.typ": dp
#import "prj.typ": prj
#import "sp.typ": sp
#import "other.typ": other_base, other_title_page
#import "thesis_base.typ": thesis_base, thesis_base_title_pages
#import "presentation.typ": presentation

#let document_types = (
  "bp": (root: bp, base: thesis_base, title_pages: thesis_base_title_pages),
  "dp": (root: dp, base: thesis_base, title_pages: thesis_base_title_pages),
  "prj": (root: prj, base: thesis_base, title_pages: thesis_base_title_pages),
  "sp": (
    root: sp,
    base: thesis_base.with(
      show_disclaimer: false,
      require_abstract: false,
      default_bonding_style: "none",
    ),
    title_pages: thesis_base_title_pages,
  ),
  "other": (root: other_title_page, base: other_base),
  "presentation": (base: presentation),
)

#let prep_args(args) = {
  let language = req_arg(args, "document.language")

  // argument pre-checking
  assert_in_dict(req_arg(args, "document.type"), document_types, "document type")
  map_arg(args, "title", v => assert_dict_has((language,), v, "title"))
  map_arg(args, "author.programme", v => assert_dict_has((language,), v, "study programme"))
  map_arg(
    args,
    "author.specialization",
    v => assert_dict_has((language,), v, "study specialization"),
  )
  map_arg(
    args,
    "acknowledgement",
    v => assert_dict_has((language,), v, "acknowledgement content"),
  )

  args.assignment = map_arg(args, "assignment", v => {
    if type(v) == str {
      "../../" + v
    } else {
      v
    }
  })
  args.citations.bibliography = map_arg(args, "citations.bibliography", v => {
    if type(v) == array {
      v.map(v => { "../../" + v })
    } else if type(v) == str {
      "../../" + v
    } else {
      panic()
    }
  })
  args.title_pages = map_arg(args, "title_pages", v => "../../" + v)

  args
}

#let template_classic(args, content) = {
  let args = prep_args(args)

  let doctype = req_arg(args, "document.type")
  let doc = document_types.at(doctype)
  if "root" in doc {
    if not is_none(get_arg(args, "title_pages")) {
      external_title_pages(req_arg(args, "title_pages"))
      doc.at("base")(args, content)
    } else {
      doc.at("root")(args)
      doc.at("base")(args, content)
    }
  } else {
    doc.at("base")(args, content)
  }
}

#let title_pages_classic(args) = {
  let args = prep_args(args)

  let doctype = req_arg(args, "document.type")
  let doc = document_types.at(doctype)
  if "title_pages" in doc {
    doc.at("root")(args)
    doc.at("title_pages")(args)
  } else {
    let panic_message = "document of type '" + doctype + "' can't generate title pages"
    panic(panic_message)
  }
}
