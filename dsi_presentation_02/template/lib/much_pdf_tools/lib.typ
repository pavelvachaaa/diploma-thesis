#let pdf_count_pages(src) = {
  import plugin("much_pdf_tools.wasm"): number_of_pages
  let count = number_of_pages(src);
  (
    count.at(3).bit-lshift(8 * 3) +
    count.at(2).bit-lshift(8 * 2) +
    count.at(1).bit-lshift(8) +
    count.at(0) 
  )
}
