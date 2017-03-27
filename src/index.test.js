import buildQuery from './';

it('should return an empty string by default', () => {
  expect(buildQuery()).toEqual('');
});

describe('filter', () => {
  describe('comparison operators', () => {
    it('should handle basic filter without operator', () => {
      const filter = { SomeProp: 1 };
      const expected = '?$filter=SomeProp eq 1';
      const actual = buildQuery({ filter });
      expect(actual).toEqual(expected);
    });

    it('should handle filter with operator', () => {
      const filter = { SomeProp: { lt: 5 } };
      const expected = '?$filter=SomeProp lt 5'
      const actual = buildQuery({ filter });
      expect(actual).toEqual(expected);
    });

    it('should allow passing filter as string and use verbatim', () => {
      const filter = 'SomeProp eq 1 and AnotherProp eq 2';
      const expected = '?$filter=SomeProp eq 1 and AnotherProp eq 2'
      const actual = buildQuery({ filter });
      expect(actual).toEqual(expected);
    });

    it('should allow passing filter as an array of objects and strings', () => {
      const filter = [{ SomeProp: 1 }, { AnotherProp: 2 }, "startswith(Name, 'R')"];
      const expected = "?$filter=(SomeProp eq 1 and AnotherProp eq 2 and startswith(Name, 'R'))"
      const actual = buildQuery({ filter });
      expect(actual).toEqual(expected);
    });

    it('should convert "in" operator to "or" statement', () => {
      const filter = { SomeProp: {'in': [1, 2, 3] } };
      const expected = '?$filter=SomeProp eq 1 or SomeProp eq 2 or SomeProp eq 3'
      const actual = buildQuery({ filter });
      expect(actual).toEqual(expected);
    });

    it('should ignore/omit filter if set to undefined', () => {
      const filter = { SomeProp: 1, IgnoreProp: undefined };
      const expected = '?$filter=SomeProp eq 1';
      const actual = buildQuery({ filter });
      expect(actual).toEqual(expected);
    });

    it('should support nested properties', () => {
      const filter = { SomeProp: { Value: 1 }};
      const expected = '?$filter=SomeProp/Value eq 1';
      const actual = buildQuery({ filter });
      expect(actual).toEqual(expected);
    });
  });

  describe('logical operators', () => {
    it('should handle simple logical operators (and, or, etc) as an array', () => {
      const filter = { and: [{ SomeProp: 1 }, { AnotherProp: 2 }] }
      const expected = "?$filter=(SomeProp eq 1 and AnotherProp eq 2)"
      const actual = buildQuery({ filter });
      expect(actual).toEqual(expected);
    });
    
    it('should handle simple logical operators (and, or, etc) as an object (no parens)', () => {
      const filter = { and: { SomeProp: 1 , AnotherProp: 2 } }
      const expected = "?$filter=SomeProp eq 1 and AnotherProp eq 2"
      const actual = buildQuery({ filter });
      expect(actual).toEqual(expected);
    });

    it('should handle nested logical operators', () => {
      const filter = { and: [{ SomeProp: 1 }, { or: [{ AnotherProp: 2 }, { ThirdProp: 3 }] }] }
      const expected = "?$filter=(SomeProp eq 1 and (AnotherProp eq 2 or ThirdProp eq 3))"
      const actual = buildQuery({ filter });
      expect(actual).toEqual(expected);
    });

    it('should handle logical operators with a single filter', () => {
      const filter = { and: [{ SomeProp: 1 }] }
      const expected = "?$filter=(SomeProp eq 1)"
      const actual = buildQuery({ filter });
      expect(actual).toEqual(expected);
    });
    
    it('should ignore implied logical operator with no filters', () => {
      const filter = []
      const expected = ""
      const actual = buildQuery({ filter });
      expect(actual).toEqual(expected);
    });

    it('should ignore logical operators with no filters', () => {
      const filter = { and: [] }
      const expected = ""
      const actual = buildQuery({ filter });
      expect(actual).toEqual(expected);
    });

    it('should handle implied logical operator on a single property', () => {
      const startDate = new Date(Date.UTC(2017, 0, 1)) 
      const endDate = new Date(Date.UTC(2017, 2, 1)) 
      const filter = { DateProp: { ge: startDate, le: endDate } }
      const expected = "?$filter=DateProp ge 2017-01-01T00:00:00Z and DateProp le 2017-03-01T00:00:00Z"
      const actual = buildQuery({ filter });
      expect(actual).toEqual(expected);
    });
  })

  describe('collection operators', () => {
    it('should handle collection operator with object as implied `and`', () => {
      const filter = {
        Tasks: {
          any: {
            AssignedGroupId: 1234,
            StatusId: 300
          }
        }
      }
      const expected = "?$filter=Tasks/any(t:t/AssignedGroupId eq 1234 and t/StatusId eq 300)"
      const actual = buildQuery({ filter });
      expect(actual).toEqual(expected);
    });

    it('should handle collection operator with array of objects as implied `and', () => {
      const filter = {
        Tasks: {
          any: [
            { AssignedGroupId: 1234 },
            { StatusId: 300 }
          ]
        }
      }
      const expected = "?$filter=Tasks/any(t:(t/AssignedGroupId eq 1234 and t/StatusId eq 300))"
      const actual = buildQuery({ filter });
      expect(actual).toEqual(expected);
    });

    it('should handle collection operator with object specifying operator', () => {
      const filter = {
        Tasks: {
          any: {
            or: [
              { AssignedGroupId: 1234 },
              { StatusId: 300 }
            ]
          }
        }
      }
      const expected = "?$filter=Tasks/any(t:(t/AssignedGroupId eq 1234 or t/StatusId eq 300))"
      const actual = buildQuery({ filter });
      expect(actual).toEqual(expected);
    });
    
    it('should handle collection operator with nested property', () => {
      const filter = {
        Tasks: {
          any: [{
            CreatedBy: {
              Name: 'Sean Lynch'
            },
            // 'CreatedBy/Name': 'Sean Lynch',
            StatusId: 300
          }]
        }
      }
      const expected = "?$filter=Tasks/any(t:(t/CreatedBy/Name eq 'Sean Lynch' and t/StatusId eq 300))"
      const actual = buildQuery({ filter });
      expect(actual).toEqual(expected);
    });
  });

  describe('data types', () => {
    it('should handle a number', () => {
      const filter = { NumberProp: 1 };
      const expected = "?$filter=NumberProp eq 1"
      const actual = buildQuery({ filter });
      expect(actual).toEqual(expected);
    });

    it('should handle a string', () => {
      const filter = { StringProp: '2' };
      const expected = "?$filter=StringProp eq '2'"
      const actual = buildQuery({ filter });
      expect(actual).toEqual(expected);
    });

    it('should handle a boolean', () => {
      const filter = { BooleanProp: true };
      const expected = "?$filter=BooleanProp eq true"
      const actual = buildQuery({ filter });
      expect(actual).toEqual(expected);
    });

    it('should handle a Date', () => {
      const filter = { DateProp: new Date(Date.UTC(2017, 2, 30, 7, 30)) };
      const expected = "?$filter=DateProp eq 2017-03-30T07:30:00Z"
      const actual = buildQuery({ filter });
      expect(actual).toEqual(expected);
    });
  });

  describe('functions', () => {
    it('should allow passing boolean functions as operators', () => {
      const filter = { Name: { contains: 'foo'} }
      const expected = "?$filter=contains(Name, 'foo')"
      const actual = buildQuery({ filter });
      expect(actual).toEqual(expected);
    });

    it('should allow functions as part of the property name', () => {
      const filter = { 'length(Name)': { gt: 10 } }
      const expected = "?$filter=length(Name) gt 10"
      const actual = buildQuery({ filter });
      expect(actual).toEqual(expected);
    });

    it('should allow functions with multiple parameters as part of the property name', () => {
      const filter = { "indexof(Name, 'foo')": { eq: 3 } }
      const expected = "?$filter=indexof(Name, 'foo') eq 3"
      const actual = buildQuery({ filter });
      expect(actual).toEqual(expected);
    });
  });
})

describe('groupBy', () => {
  it('should allow passing since property as string', () => {
    const groupBy = 'SomeProp';
    const expected = '?$apply=groupby((SomeProp),aggregate(Id with countdistinct as Total))';
    const actual = buildQuery({ groupBy });
    expect(actual).toEqual(expected);
  });

  it('should allow filtering', () => {
    const groupBy = 'SomeProp';
    const filter = { PropName: 1 };
    const expected = '?$apply=filter(PropName eq 1)/groupby((SomeProp),aggregate(Id with countdistinct as Total))';
    const actual = buildQuery({ filter, groupBy });
    expect(actual).toEqual(expected);
  });

  it('should allow passing multiple properites as an array', () => {
    const groupBy = ['FirstProp', 'SecondProp'];
    const expected = '?$apply=groupby((FirstProp,SecondProp),aggregate(Id with countdistinct as Total))';
    const actual = buildQuery({ groupBy });
    expect(actual).toEqual(expected);
  });

  it('should allow ordering', () => {
    const groupBy = 'SomeProp';
    const orderBy = 'SomeProp'
    const expected = '?$apply=groupby((SomeProp),aggregate(Id with countdistinct as Total))&$orderby=SomeProp';
    const actual = buildQuery({ groupBy, orderBy });
    expect(actual).toEqual(expected);
  });
})

describe('select', () => {
  it('should support passing an array of strings', () => {
    const select = ['foo', 'bar'];
    const expected = '?$select=foo,bar';
    const actual = buildQuery({ select });
    expect(actual).toEqual(expected);
  });

  it('should support passing a string and use verbatim', () => {
    const select = 'foo,bar';
    const expected = '?$select=foo,bar';
    const actual = buildQuery({ select });
    expect(actual).toEqual(expected);
  });

  // TOOD: Support dot '.' and slash '/' smart expansion
})

describe('orderBy', () => {
  it('should support passing an array of strings', () => {
    const orderBy = ['foo', 'bar'];
    const expected = '?$orderby=foo,bar';
    const actual = buildQuery({ orderBy });
    expect(actual).toEqual(expected);
  });

  it('should support passing a string and use verbatim', () => {
    const orderBy = 'foo,bar';
    const expected = '?$orderby=foo,bar';
    const actual = buildQuery({ orderBy });
    expect(actual).toEqual(expected);
  });
})

describe('key', () => {
  it('should support key as simple value', () => {
    const key = 1;
    const expected = '(1)';
    const actual = buildQuery({ key });
    expect(actual).toEqual(expected);
  });

  it('should support key as object', () => {
    const key = { Id: 1 };
    const expected = '(Id=1)';
    const actual = buildQuery({ key });
    expect(actual).toEqual(expected);
  });

  it('should support key as object with multiple keys', () => {
    const key = { OrderID: 1, ItemNo: 2 };
    const expected = '(OrderID=1,ItemNo=2)';
    const actual = buildQuery({ key });
    expect(actual).toEqual(expected);
  });

  it('should support key with filter', () => {
    const key = 1;
    const filter = { SomeProp: 123 };
    const expected = '(1)?$filter=SomeProp eq 123';
    const actual = buildQuery({ key, filter });
    expect(actual).toEqual(expected);
  });

  it('should support key with expand', () => {
    const key = 1;
    const expand = ['Foo']
    const expected = '(1)?$expand=Foo';
    const actual = buildQuery({ key, expand });
    expect(actual).toEqual(expected);
  });
});

describe('count', () => {
  it('should support include counts', () => {
    const count = true;
    const expected = '?$count=true';
    const actual = buildQuery({ count });
    expect(actual).toEqual(expected);
  });

  it('should query for only count', () => {
    const count = {};
    const expected = '/$count';
    const actual = buildQuery({ count });
    expect(actual).toEqual(expected);
  });

  it('should query for only count with filter', () => {
    const count = { PropName: 1 };
    const expected = '/$count?$filter=PropName eq 1';
    const actual = buildQuery({ count });
    expect(actual).toEqual(expected);
  });
  
  it('should allow groupby when querying for only count', () => {
    const count = { PropName: 1 };
    const groupBy = 'SomeProp';
    const expected = '/$count?$apply=filter(PropName eq 1)/groupby((SomeProp),aggregate(Id with countdistinct as Total))';
    const actual = buildQuery({ count, groupBy });
    expect(actual).toEqual(expected);
  });
})

describe('pagination', () => {
  it('should support limiting (top)', () => {
    const top = 25;
    const expected = '?$top=25';
    const actual = buildQuery({ top });
    expect(actual).toEqual(expected);
  });

  it('should support skipping', () => {
    const skip = 50;
    const expected = '?$skip=50';
    const actual = buildQuery({ skip });
    expect(actual).toEqual(expected);
  });

  it('should support paginating (skip and limiting)', () => {
    const page = 3;
    const perPage = 25;
    const top = perPage;
    const skip = perPage * (page - 1);
    const expected = '?$top=25&$skip=50';
    const actual = buildQuery({ top, skip });
    expect(actual).toEqual(expected);
  });
})

describe('expand', () => {
  it('should support basic expansion', () => {
    const expand = 'Foo';
    const expected = '?$expand=Foo';
    const actual = buildQuery({ expand });
    expect(actual).toEqual(expected);
  });

  it('should support multiple expands as an array', () => {
    const expand = ['Foo', 'Bar'];
    const expected = '?$expand=Foo,Bar';
    const actual = buildQuery({ expand });
    expect(actual).toEqual(expected);
  });

  it('should allow nested expands with slash seperator', () => {
    const expand = 'Friends/Photos'
    const expected = '?$expand=Friends($expand=Photos)';
    const actual = buildQuery({ expand });
    expect(actual).toEqual(expected);
  });

  it('should support multiple nested expands with slash seperator as an array', () => {
    const expand = ['Foo/Bar/Baz', 'One/Two'];
    const expected = '?$expand=Foo($expand=Bar($expand=Baz)),One($expand=Two)';
    const actual = buildQuery({ expand });
    expect(actual).toEqual(expected);
  });

  it('should allow nested expands with objects', () => {
    const expand = { Friends: { expand: 'Photos' } };
    const expected = '?$expand=Friends($expand=Photos)';
    const actual = buildQuery({ expand });
    expect(actual).toEqual(expected);
  });
  
  it('should allow multiple nested expands with objects', () => {
    const expand = [{ Friends: { expand: 'Photos' } }, { One: { expand: 'Two' } }];
    const expected = '?$expand=Friends($expand=Photos),One($expand=Two)';
    const actual = buildQuery({ expand });
    expect(actual).toEqual(expected);
  });

  it('should allow multiple expands mixing objects and strings', () => {
    const expand = [{ Friends: { expand: 'Photos' } }, 'Foo/Bar/Baz'];
    const expected = '?$expand=Friends($expand=Photos),Foo($expand=Bar($expand=Baz))';
    const actual = buildQuery({ expand });
    expect(actual).toEqual(expected);
  });

  it('should allow expand with select', () => {
    const expand = { Friends: { select: 'Name' } };
    const expected = '?$expand=Friends($select=Name)';
    const actual = buildQuery({ expand });
    expect(actual).toEqual(expected);
  });

  it('should allow expand with top', () => {
    const expand = { Friends: { top: 10 } };
    const expected = '?$expand=Friends($top=10)';
    const actual = buildQuery({ expand });
    expect(actual).toEqual(expected);
  });

  it('should allow expand with select and top', () => {
    const expand = { Friends: { select: 'Name', top: 10 } };
    const expected = '?$expand=Friends($select=Name;$top=10)';
    const actual = buildQuery({ expand });
    expect(actual).toEqual(expected);
  });

  it('should allow expand with select as array and top', () => {
    const expand = { Friends: { select: ['Name', 'Age'], top: 10 } };
    const expected = '?$expand=Friends($select=Name,Age;$top=10)';
    const actual = buildQuery({ expand });
    expect(actual).toEqual(expected);
  });

  it('should allow expand with filter', () => {
    const expand = { Trips: { filter: { Name: 'Trip in US' } } };
    const expected = "?$expand=Trips($filter=Name eq 'Trip in US')";
    const actual = buildQuery({ expand });
    expect(actual).toEqual(expected);
  });

  it('should allow expand with orderby', () => {
    const expand = { Products: { orderBy: 'ReleaseDate asc' } };
    const expected = "?$expand=Products($orderby=ReleaseDate asc)";
    const actual = buildQuery({ expand });
    expect(actual).toEqual(expected);
  });
});
