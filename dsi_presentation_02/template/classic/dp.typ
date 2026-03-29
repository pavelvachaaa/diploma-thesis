#import "../arguments.typ": req_arg, get_arg, map_arg
#import "../utils.typ": assert_dict_has, is_none
#import "common.typ": mainpage, assignment, external_title_pages

#let dp(args) = {
  let language = req_arg(args, "document.language");
  let programme = req_arg(args, "author.programme");
  assert_dict_has((language,), programme, "study programme");
  map_arg(args, "author.specialization", (v) => {
    assert_dict_has((language,), v, "study specialization");
  });
  if language == "cs" {
    let _ = req_arg(args, "author.pronouns");
  }

  mainpage(args);
  assignment(args);
}
