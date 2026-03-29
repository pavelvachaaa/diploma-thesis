#let embed_full(src) = {
  import "./lib/much_pdf_tools/lib.typ": pdf_count_pages;
  let page_count = pdf_count_pages(src);
  for idx in range(0, page_count) {
    page(
      place(center + horizon, image(src, page: idx + 1, fit: "contain", width: auto, height: auto)),
      margin: 0cm,
      footer: none,
      header: none,
    );
  }
}
