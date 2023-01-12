# Other

## Updating the wiki

To modify the wiki's content, you need to do it in the
[`./docs`](https://github.com/datagir/nosgestesclimat/tree/master/docs)
folder.
Once modification pushed in `master`, a [GitHub
Action](https://github.com/datagir/nosgestesclimat/blob/master/.github/workflows/publish-wiki.yaml)
will update the wiki from the content of the
[`./docs`](https://github.com/datagir/nosgestesclimat/tree/master/docs)
folder.

### Contribution guide from GitHub

1. Go to the
   [`docs`](https://github.com/datagir/nosgestesclimat/tree/master/docs)
   folder in the `master` branch.
   - To add new wiki page, you need to create a new file: `Add file > Create new file`.
   - To modify an existing page, you can click directly on its name and press
     `E` to edit it.
2. Edit the selected file.
3. When all changes have been made, go to the bottom of the page under the `Commit changes` section. Enter in the first text field:

```
docs: update (or create) the documentation file <edited_filename>.
```

4. Finally, select the `Create a new branch for this commit and start a pull request.` option. You can add more information if you want about your
   translation before clicking on the `Create pull request` button to open the
   pull request.

Well done! We will look at your proposition before integrating the changes to
the project.

> **Note**: make sure to update the `_Sidebar.md` file to match with new
> or modified section names to keep them accessible from the wiki's sidebar.
