// tools & utils
#import "../theme.typ": faculty_logotype, tul_logomark, faculty_color
#import "../lang.typ": lang_id, get_lang_item
#import "../utils.typ": assert_in_dict, assert_in_arr, map_none, assert_dict_has, is_none
#import "../arguments.typ": req_arg, map_arg, get_arg
#import "common.typ": default_styling, external_title_pages

// thesis types
#import "bp.typ": bp
#import "dp.typ": dp
#import "prj.typ": prj
#import "sp.typ": sp
#import "other.typ": other_title_page, other_base
#import "thesis_base.typ": thesis_base, thesis_base_title_pages

#let document_types = (
  "bp": (bp, thesis_base, thesis_base_title_pages),
  "dp": (dp, thesis_base, thesis_base_title_pages),
  "prj": (prj, thesis_base, thesis_base_title_pages),
  "sp": (sp, thesis_base.with(
    show_disclaimer: false,
    require_abstract: false,
  ), thesis_base_title_pages),
  "other": (other_title_page, other_base, (args) => {}),
)

#let prep_args(args) = {
  let language = req_arg(args, "document.language");

  // argument pre-checking
  assert_in_dict(req_arg(args, "document.type"), document_types, "document type");
  map_arg(args, "title", (v) => assert_dict_has((language,), v, "title"));
  map_arg(args, "author.programme", (v) => assert_dict_has((language,), v, "study programme"));
  map_arg(
    args, "author.specialization", (v) => assert_dict_has((language,), v, "study specialization")
  );
  map_arg(
    args, "acknowledgement", (v) => assert_dict_has((language,), v, "acknowledgement content")
  );

  args.assignment = map_arg(args, "assignment", (v) => {
    if type(v) == str {
      "../../" + v
    } else {
      v
    }
  });
  args.citations = map_arg(args, "citations", (v) => "../../" + v);
  args.title_pages = map_arg(args, "title_pages", (v) => "../../" + v);

  args
}

#let template_classic(args, content) = {
  let args = prep_args(args);

  if not is_none(get_arg(args, "title_pages")) {
    external_title_pages(req_arg(args, "title_pages"));
    document_types.at(req_arg(args, "document.type")).at(1)(args, content);
  } else {
    document_types.at(req_arg(args, "document.type")).at(0)(args);
    document_types.at(req_arg(args, "document.type")).at(1)(args, content);
  }
}

#let title_pages_classic(args) = {
  let args = prep_args(args);

  document_types.at(req_arg(args, "document.type")).at(0)(args);
  document_types.at(req_arg(args, "document.type")).at(2)(args);
}
