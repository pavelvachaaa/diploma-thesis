#import "../arguments.typ": req_arg, get_arg
#import "../utils.typ": assert_dict_has, is_none
#import "common.typ": mainpage, assignment, external_title_pages

#let prj(args) = {
  let language = req_arg(args, "document.language");
  let programme = req_arg(args, "author.programme");
  assert_dict_has((language,), programme, "study programme");
  let specialization = req_arg(args, "author.specialization");
  assert_dict_has((language,), specialization, "study specialization");
  if language == "cs" {
    let _ = req_arg(args, "author.pronouns");
  }

  mainpage(args);
  assignment(args, show_fallback: false);
}
