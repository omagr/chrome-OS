class Bookmark {
    constructor(Name, Link, parentId) {
        this.Name = Name;
        this.Link = Link;
        this.Parent = parentId;
    }
}

class Group {
    Bookmarks = [];
    constructor(Name, Id) {
        this.Name = Name;
        this.Id = Id;
    }
}

export { Group, Bookmark };
