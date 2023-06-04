class WhereClause {
  constructor(base, bigQ) {
    this.base = base;
    this.bigQ = bigQ;
  }

  search() {
    const searchWord = this.bigQ.searchWord
      ? {
          name: {
            $regex: this.bigQ.search,
            $options: "i",
          },
        }
      : {};
    this.base = this.base.find({ ...searchWord });
    return this;
  }

  pager(resultPerPage) {
    let currentPage = 1;
    if (this.bigQ.page) {
      currentPage = Number(this.bigQ.page);
    }
    const skip = resultPerPage * (currentPage - 1);
    this.base = this.base.limit(resultPerPage).skip(skip);
    return this;
  }

  filter() {
    const copyQuery = { ...this.bigQ };
    const removeFields = ["search", "page", "sort", "limit"];
    removeFields.forEach((el) => delete copyQuery[el]);

    let stringOfCopyQ = JSON.stringify(copyQuery);
    stringOfCopyQ = stringOfCopyQ.replace(
      /\b(gte|lte|gt|lt)\b/g,
      (m) => `$${m}`
    );

    const jsonOfCopyQ = JSON.parse(stringOfCopyQ);
    this.base = this.base.find(jsonOfCopyQ);
    return this;
  }
}
module.exports = WhereClause;
