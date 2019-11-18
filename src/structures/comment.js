import Immutable from 'immutable';

/* the standard comment format should be a JSON schema like:
{
  "general": "it's general comment",
  "tags": ["tag1","tag2","tag3"]
}
*/

const CommentBase = Immutable.Record({
  general: '',
  tags: new Immutable.Set(),
});


export default class Comment extends CommentBase {
  static parse(content) {
    let data;
    // should we use JSON schema validator here?
    try {
      data = JSON.parse(content);
    } catch (e) {
      data = { general: content };
    }
    if (typeof data === 'number') {
      data = { general: String(data) };
    }
    return new Comment({
      general: data.general,
      tags: new Immutable.Set(data.tags || []),
    });
  }

  toString() {
    return JSON.stringify(this.toJS());
  }

  updateTags(tags) {
    return this.set('tags', new Immutable.Set(tags));
  }

  getShowTags() {
    let tags;
    tags = this.get('tags').toJS();
    if (tags.length === 0) {
      tags = ['未分类'];
    }
    return tags;
  }

  getTags() {
    return this.get('tags').toJS();
  }

  getComment() {
    return this.get('general');
  }
}
