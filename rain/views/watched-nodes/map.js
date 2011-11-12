function(doc) {
  if (doc.stamp) {
      var p = doc.profile || {};
      emit(doc.stamp, doc);
  }
}