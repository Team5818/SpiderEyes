# SpiderEyes

[![Latest Release](https://img.shields.io/github/release/Team5818/SpiderEyes.svg?style=flat-square)](https://github.com/Team5818/SpiderEyes/releases)

FRC Scouting web application.

Takes in CSV files and makes a table from them.
From there you can use the modification buttons at the top to further analyze
the data. Modification buttons always produce a new tab, so you will never
delete your original data using them.

## Modification Buttons

#### Synthesize Column
*Synthesize Column* will allow you to sum multiple values in a data
row to create a new value, useful for making a general "score" column.

#### Calculate Averages
*Calculate Averages* will take every row with a matching key (as specified
by the "key" column), extract the values from the "values" columns, and
average each value together.

For example, with key column `Team` and value columns `A` and `B`,

|Team|A   |B   |C   |
|----|----|----|----|
|1   |50  |10  |99  |
|2   |30  |10  |24  |
|1   |20  |10  |39  |
|2   |40  |10  |11  |

turns into this:

|Team|A        |B         |
|----|---------|----------|
|1   |35.00±...|10.00±0.00|
|2   |35.00±...|10.00±0.00|

The two columns are averaged independently, and extra columns are removed.

## Column Edits
You can edit certain properties of columns. Currently, you can only edit the
_score_ property, which multiplies all of the values in the column by what you
enter. This is useful for measuring game features in points, rather than
amounts.

## Building
This is fairly simple to build. Simply run `pnpm install` to grab the required
dependencies, then `pnpm run build` to build everything. You can then serve
the `dist` folder, and the application is ready!

If you want to develop, use `pnpm run dev`, which will start a server for you.
