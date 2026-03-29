#import "../arguments.typ": req_arg, get_arg, map_arg
#import "../utils.typ": assert_dict_has
#import "common.typ": mainpage, assignment

#let sp(args) = {
  let language = req_arg(args, "document.language");
  map_arg(args, "author.programme", (v) => {
    assert_dict_has((language,), v, "study programme");
  });
  map_arg(args, "author.specialization", (v) => {
    assert_dict_has((language,), v, "study specialization");
  });
  if language == "cs" {
    let _ = req_arg(args, "author.pronouns");
  }

  mainpage(args);
  assignment(args, show_fallback: false);
}
