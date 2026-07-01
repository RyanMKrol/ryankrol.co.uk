import V1EditList from '../../../../components/v1/V1EditList';

export default function V1EditBooks() {
  return (
    <V1EditList
      breadcrumb="~ / reviews / books / edit"
      endpoint="/api/reviews/books"
      typeLabel="books"
      getSecondary={(item) => item.author}
      getEditHref={(item) =>
        `/v1/reviews/books/edit/${encodeURIComponent(`${item.title}|${item.author}`)}`
      }
    />
  );
}
