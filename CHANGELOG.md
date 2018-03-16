# Change Log

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

<a name="2.1.2"></a>
## [2.1.2](https://github.com/calebdwilliams/templiteral/compare/v2.1.1...v2.1.2) (2018-03-16)


### Bug Fixes

* **Template:** Added propPattern ([0d9db76](https://github.com/calebdwilliams/templiteral/commit/0d9db76))



<a name="2.1.1"></a>
## [2.1.1](https://github.com/calebdwilliams/templiteral/compare/v2.1.0...v2.1.1) (2018-03-16)


### Bug Fixes

* **docs:** Fixed doc error ([3ce00ba](https://github.com/calebdwilliams/templiteral/commit/3ce00ba))



<a name="2.1.0"></a>
# [2.1.0](https://github.com/calebdwilliams/templiteral/compare/v2.0.4...v2.1.0) (2018-03-16)


### Features

* **Fragment:** Added Fragment class for directives ([1dd85e1](https://github.com/calebdwilliams/templiteral/commit/1dd85e1))
* **repeat and if:** Added t-repeat and t-if ([c1ee443](https://github.com/calebdwilliams/templiteral/commit/c1ee443))



<a name="2.0.4"></a>
## [2.0.4](https://github.com/calebdwilliams/templiteral/compare/v2.0.3...v2.0.4) (2018-01-11)


### Bug Fixes

* **templateCache:** Changed templateCache to a WeakMap ([d184288](https://github.com/calebdwilliams/templiteral/commit/d184288))



<a name="2.0.3"></a>
## [2.0.3](https://github.com/calebdwilliams/templiteral/compare/v2.0.2...v2.0.3) (2018-01-06)



<a name="2.0.2"></a>
## [2.0.2](https://github.com/calebdwilliams/templiteral/compare/v2.0.1...v2.0.2) (2018-01-06)


### Bug Fixes

* **AttributeNode:** Fixed issue where non strings wouldn't bind with bracket notation ([6c4786a](https://github.com/calebdwilliams/templiteral/commit/6c4786a))



<a name="2.0.1"></a>
## [2.0.1](https://github.com/calebdwilliams/templiteral/compare/v2.0.0...v2.0.1) (2018-01-02)


### Bug Fixes

* **ContentNode:** Fixed multiple bindings per content node ([185e51c](https://github.com/calebdwilliams/templiteral/commit/185e51c))



<a name="2.0.0"></a>
# [2.0.0](https://github.com/calebdwilliams/templiteral/compare/v1.2.2...v2.0.0) (2017-12-27)


### Features

* **templiteral:** v2 refactor ([cca2c71](https://github.com/calebdwilliams/templiteral/commit/cca2c71))


### BREAKING CHANGES

* **templiteral:** New compiler



<a name="1.2.2"></a>
## [1.2.2](https://github.com/calebdwilliams/templiteral/compare/v1.2.1...v1.2.2) (2017-11-14)


### Bug Fixes

* **Template:** Removed Template.node which allows nested templiterals ([6391fd8](https://github.com/calebdwilliams/templiteral/commit/6391fd8))



<a name="1.2.1"></a>
## [1.2.1](https://github.com/calebdwilliams/templiteral/compare/v1.2.0...v1.2.1) (2017-11-03)


### Bug Fixes

* **AttributeNode:** Removes event listeners on Template.disconnect() ([8ae75b4](https://github.com/calebdwilliams/templiteral/commit/8ae75b4))



<a name="1.2.0"></a>
# [1.2.0](https://github.com/calebdwilliams/templiteral/compare/v1.1.3...v1.2.0) (2017-11-03)


### Features

* **default context:** The templiteral function now sets context to this by default ([796f784](https://github.com/calebdwilliams/templiteral/commit/796f784))



<a name="1.1.3"></a>
## [1.1.3](https://github.com/calebdwilliams/templiteral/compare/v1.1.2...v1.1.3) (2017-10-28)


### Bug Fixes

* **Minor updates:** Fixed some style issues and added eslint ([a65d724](https://github.com/calebdwilliams/templiteral/commit/a65d724))



<a name="1.1.2"></a>
## [1.1.2](https://github.com/calebdwilliams/templiteral/compare/v1.1.1...v1.1.2) (2017-10-27)



<a name="1.1.1"></a>
## [1.1.1](/compare/v1.1.0...v1.1.1) (2017-10-26)



<a name="1.1.0"></a>
# 1.1.0 (2017-10-25)


### Bug Fixes

* Removed unused variables b705e12
* **removed eval:** Removed eval for Function constructor ced4b23
* **removed files:** Removed unused files and added more experiments to base component 2089f13


### Features

* Compile b276117
* Compile cdbb4ad
* Complete initial implementation fc984ee
* **allow two-way binding:** Made some minor changes to force two-way binding if wanted d3f3d72
* **attribute binding:** Added attribute binding 0770a1d
* **events:** Added Angular-style event handling 6d5200a
