# Webtypist

[Webtypist](https://webtypist.vercel.app) is a browser-based typing tutor.

It teaches you how to touch-type and improve your typing speed. There are a plenty of lessons ranging from beginner to advanced including one for programmers (`(p) series`) and special keyboards (Numpad `(n) series`, Colemak `(c series)`)

![webtypist2](https://github.com/arshzip/webtypist/assets/23417273/fe40ac93-44b4-4ca2-97da-15d3a590ddc2)


Give it a try here - [webtypist.vercel.app](https://webtypist.vercel.app)

Webtypist is inspired by GNU typist (`gtypist`) and is capable of parsing and running `.typ` lessons built for GNU Typist. In other words, you can call it gtypist for the web.


## Lessons included
- Quick QWERTY (q) Series
- Long QWERTY (r) Series
- Speed Drills (s) Series
- Programmer (p) Series
- QWERTY review (u) Series
- Numpad (n) Series
- Colemak (c) Series
- Dvorak (d) Series

## How do I make my own lesson?
All lessons on webtypist are GNU typist `.typ` files which are inside the `/public` folder of this repository. Have a look at `demo.typ` to understand the basic commands used. Open [webtypist](https://webtypist.vercel.app) and click the "Make your own lesson" button to see how `demo.typ` runs.

To learn more check the [GNU Typist Manual](https://www.gnu.org/software/gtypist/doc/gtypist.html#Script-file-commands)



## Contributing
You can contribute lessons or code by submitting a pull request. Support for non-English lessons isn't guaranteed so try running those before you open a PR.

## Coming soon
- Type ahead and sync behind error correction
- KDE's .ktouch file support

## Thanks
- GNU Typist authors and contributors for the [original `gtypist` program](https://www.gnu.org/savannah-checkouts/gnu/gtypist/gtypist.html), through which I learnt to type
- [Daniel Sockwell](https://codesections.com/) for authoring the `(p) series` lesson

Happy typing!
