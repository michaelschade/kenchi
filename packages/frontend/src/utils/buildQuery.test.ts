import buildQuery from './buildQuery';

it('appends new query params', () => {
  expect(buildQuery({}, { the_cat_goes: 'meow' })).toEqual('the_cat_goes=meow');
});

it('updates existing query params', () => {
  expect(
    buildQuery(
      { the_dog_goes: 'woof', the_cat_goes: 'rrrow' },
      { the_cat_goes: 'meow' }
    )
  ).toEqual('the_dog_goes=woof&the_cat_goes=meow');
});

it('removes query params', () => {
  expect(
    buildQuery(
      { the_dog_goes: 'woof', the_cat_goes: 'rrrow' },
      { the_cat_goes: undefined }
    )
  ).toEqual('the_dog_goes=woof');
});

it('uses index notation for arrays', () => {
  expect(buildQuery({}, { the_cats_go: ['meow', 'meeow', 'meeeow'] })).toEqual(
    'the_cats_go[0]=meow&the_cats_go[1]=meeow&the_cats_go[2]=meeeow'
  );
});

it('nests params', () => {
  expect(
    buildQuery({}, { the_cats: { magical_mister_mistoffelees: 'so clever' } })
  ).toEqual('the_cats[magical_mister_mistoffelees]=so%20clever');
});

it('encodes param values', () => {
  expect(buildQuery({}, { name: 'A&B' })).toEqual('name=A%26B');
});

it('merges nested query params', () => {
  expect(
    buildQuery(
      { cats: { breed: 'jellical', sound: 'singing' } },
      { cats: { sound: 'rrrow' } }
    )
  ).toEqual('cats[breed]=jellical&cats[sound]=rrrow');
});

it('removes nested query params', () => {
  expect(
    buildQuery(
      { cats: { breed: 'jellical', sound: 'singing' } },
      { cats: { sound: undefined } }
    )
  ).toEqual('cats[breed]=jellical');
});

it('removes the parent key when all nested params are cleared', () => {
  expect(
    buildQuery({ cats: { breed: 'jellical' } }, { cats: { breed: undefined } })
  ).toEqual('');
});
