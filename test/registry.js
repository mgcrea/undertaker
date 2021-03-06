'use strict';

var lab = exports.lab = require('lab').script();
var expect = require('code').expect;

var describe = lab.describe;
var it = lab.it;

var Undertaker = require('../');

var DefaultRegistry = require('undertaker-registry');
var CommonRegistry = require('undertaker-common-tasks');
var MetadataRegistry = require('undertaker-task-metadata');

function noop(){}

function CustomRegistry(){}
CustomRegistry.prototype.get = noop;
CustomRegistry.prototype.set = noop;
CustomRegistry.prototype.tasks = noop;

function InvalidRegistry(){}

describe('registry', function(){

  describe('method', function(){

    it('should return the current registry when no arguments are given', function(done){
      var taker = new Undertaker();
      expect(taker.registry()).to.equal(taker._registry);
      done();
    });

    it('should set the registry to the given registry instance argument', function(done){
      var taker = new Undertaker();
      var customRegistry = new CustomRegistry();
      taker.registry(customRegistry);
      expect(taker.registry()).to.equal(customRegistry);
      done();
    });

    it('should validate the custom registry instance', function(done){
      var taker = new Undertaker();
      var invalid = new InvalidRegistry();

      function invalidSet(){
        taker.registry(invalid);
      }

      expect(invalidSet).to.throw(Error, 'Custom registry must have `get` function');
      done();
    });

    it('should transfer all tasks from old registry to new', function(done){
      var taker = new Undertaker(CommonRegistry);
      var customRegistry = new DefaultRegistry();
      taker.registry(customRegistry);

      expect(taker.get('clean')).to.be.a.function();
      expect(taker.get('serve')).to.be.a.function();
      done();
    });

    it('allows multiple custom registries to used', function(done){
      var taker = new Undertaker();
      taker.registry(new CommonRegistry());

      expect(taker.get('clean')).to.be.a.function();
      expect(taker.get('serve')).to.be.a.function();

      taker.registry(new MetadataRegistry());
      taker.set('context', function(cb){
        expect(this).to.deep.equal({ name: 'context' });
        cb();
        done();
      });

      taker.registry(new DefaultRegistry());

      expect(taker.get('clean')).to.be.a.function();
      expect(taker.get('serve')).to.be.a.function();
      expect(taker.get('context')).to.be.a.function();

      taker.series('context')();
    });
  });

  describe('constructor', function(){

    it('should take a custom registry constructor on instantiation', function(done){
      var taker = new Undertaker(CustomRegistry);
      expect(taker.registry()).to.be.an.instanceof(CustomRegistry);
      expect(taker.registry()).to.not.be.an.instanceof(DefaultRegistry);
      done();
    });

    it('should default to undertaker-registry if not constructed with custom registry', function(done){
      var taker = new Undertaker();
      expect(taker.registry()).to.be.an.instanceof(DefaultRegistry);
      expect(taker.registry()).to.not.be.an.instanceof(CustomRegistry);
      done();
    });

    it('should take a registry that pre-defines tasks', function(done){
      var taker = new Undertaker(CommonRegistry);
      expect(taker.registry()).to.be.an.instanceof(CommonRegistry);
      expect(taker.registry()).to.be.an.instanceof(DefaultRegistry);
      expect(taker.get('clean')).to.be.a.function();
      expect(taker.get('serve')).to.be.a.function();
      done();
    });

    it('should throw upon invalid registry', function(done){
      /*eslint no-unused-vars: 0*/
      var taker;

      function noGet(){
        taker = new Undertaker(InvalidRegistry);
      }

      expect(noGet).to.throw(Error, 'Custom registry must have `get` function');
      InvalidRegistry.prototype.get = noop;

      function noSet(){
        taker = new Undertaker(InvalidRegistry);
      }

      expect(noSet).to.throw(Error, 'Custom registry must have `set` function');
      InvalidRegistry.prototype.set = noop;

      function noTasks(){
        taker = new Undertaker(InvalidRegistry);
      }

      expect(noTasks).to.throw(Error, 'Custom registry must have `tasks` function');
      InvalidRegistry.prototype.tasks = noop;

      taker = new Undertaker(InvalidRegistry);
      done();
    });
  });

});
