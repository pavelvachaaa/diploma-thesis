#import "utils.typ": assert_type_signature, is_none, map_none, deref, assert_dict_has

#let arguments_structure = (
  document: (
    visual_style: "string",
    faculty: "string",
    language: "string",
    type: "string",
  ),
  title_pages: "string | boolean | none",
  title: "dictionary[string : string | content] | none",
  author: (
    name: "string | content | none",
    pronouns: "string | none",
    programme: "dictionary[string : string | content] | none",
    specialization: "dictionary[string : string | content] | none",
    year_of_study: "string | content | none",
  ),
  project: (
    supervisor: "string | content | dictionary[string : string | content] | none",
    consultant: "string | content | dictionary[string : string | content] | none",
  ),
  abstract: (
    content: "dictionary[string : string | content] | none",
    keywords: "dictionary[string : string | content | array[string]] | none",
  ),
  acknowledgement: "dictionary[string : string | content] | none",
  assignment: "dictionary[string : any] | content | string | none",
  citations: "string",
);

#let assignment_structure = (
  personal_number: "string | content",
  department: "string | content",
  academical_year: "string | content",
  content: "content",
);


#let check_arguments(args, structure: arguments_structure, namespace: none) = {
  let check_arguments_dict(structure, args, argument_path) = {
    for (key, value) in structure.pairs() {
      argument_path.push(str(key).replace("_", " "));

      if not key in args {
        panic("invalid arguments definition");
      }
      let arg = args.at(key);

      if type(value) == dictionary {
        check_arguments_dict(value, arg, argument_path);
      } else if type(value) == str {
        assert_type_signature(arg, value, argument_path.join(" "));
      } else {
        panic("invalid arguments definition");
      }

      let _ = argument_path.pop();
    }
  }

  check_arguments_dict(structure, args, if is_none(namespace) { () } else { (namespace,) });
}

#let get_arg_single(args, path) = {
  let args = args;
  for segment in path.split(".") {
    if segment not in args {
      panic("invalid argument query path: " + str(path));
    }
    args = args.at(segment);
  }
  args
}

#let get_arg(args, path) = {
  if type(path) == array {
    let res = ();
    for path in path {
      res.push(get_arg_single(args, path));
    }
    res
  } else if type(path) == str {
    get_arg_single(args, path)
  } else {
    panic("invalid argument path");
  }
}

#let req_arg_single(args, path) = {
  let arg = get_arg_single(args, path);
  if is_none(arg) {
    let panic_message = path.split(".").join(" ").replace("_", " ") + " is missing";
    panic(panic_message);
  }
  arg
}

#let req_arg(args, path) = {
  if type(path) == array {
    let res = ();
    for path in path {
      res.push(req_arg_single(args, path));
    }
    res
  } else if type(path) == str {
    req_arg_single(args, path)
  } else {
    panic("invalid argument path");
  }
}

#let map_arg_single(args, path, mapper) = {
  let arg = get_arg(args, path);
  map_none(arg, mapper)
}

#let map_arg(args, path, mapper) = {
  if type(path) == array {
    let res = ();
    for path in path {
      res.push(map_arg_single(args, path, mapper));
    }
    res
  } else if type(path) == str {
    map_arg_single(args, path, mapper)
  } else {
    panic("invalid argument path");
  }
}

#let assignment_info(assignment) = {
  if type(assignment) == dictionary {
    assert_dict_has(assignment_structure.keys(), assignment, "assignment");
    check_arguments(assignment, structure: assignment_structure, namespace: "assignment");
  }
  assignment
}

#let arguments(
  document_info,
  title_pages,
  title,
  author_info,
  project_info,
  abstract_info,
  acknowledgement,
  assignment,
  citations,
) = {
  (
    document: document_info,
    title_pages: title_pages,
    title: title,
    author: author_info,
    project: project_info,
    abstract: abstract_info,
    acknowledgement: acknowledgement,
    assignment: assignment_info(assignment),
    citations: citations,
  )
}

#let document_info(visual_style, faculty_abbreviation, language_abbreviation, document_type) = {
  (
    visual_style: visual_style,
    faculty: faculty_abbreviation,
    language: language_abbreviation,
    type: document_type,
  )
}

#let author_info(name, pronouns, programme, specialization, year_of_study) = {
  (
    name: name,
    pronouns: pronouns,
    programme: programme,
    specialization: specialization,
    year_of_study: year_of_study,
  )
}

#let project_info(supervisor, consultant) = {
  (supervisor: supervisor, consultant: consultant)
}

#let abstract_info(abstract, keywords) = {
  (content: abstract, keywords: keywords)
}
