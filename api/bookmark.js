class Bookmark {
    constructor(Name, Link, parentId) {
        this.Name = Name;
        this.Link = Link;
        this.Parent = parentId;
    };
}

class Group {
    Bookmarks = [];
    constructor(Name, Id) {
        this.Name = Name;
        this.Id = Id;
    };
}

export { Group, Bookmark }


// const a = new Group("A", 1);
// const b = new Group("B", 2);
// const c = new Group("C", 3);

// a.createBookmark('p', 11)
// b.createBookmark('q', 22)
// a.createBookmark('r', 13)
// c.createBookmark('t', 354)
// a.createBookmark('i', 16)
