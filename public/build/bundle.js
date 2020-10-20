
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function null_to_empty(value) {
        return value == null ? '' : value;
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
    function outro_and_destroy_block(block, lookup) {
        transition_out(block, 1, 1, () => {
            lookup.delete(block.key);
        });
    }
    function update_keyed_each(old_blocks, dirty, get_key, dynamic, ctx, list, lookup, node, destroy, create_each_block, next, get_context) {
        let o = old_blocks.length;
        let n = list.length;
        let i = o;
        const old_indexes = {};
        while (i--)
            old_indexes[old_blocks[i].key] = i;
        const new_blocks = [];
        const new_lookup = new Map();
        const deltas = new Map();
        i = n;
        while (i--) {
            const child_ctx = get_context(ctx, list, i);
            const key = get_key(child_ctx);
            let block = lookup.get(key);
            if (!block) {
                block = create_each_block(key, child_ctx);
                block.c();
            }
            else if (dynamic) {
                block.p(child_ctx, dirty);
            }
            new_lookup.set(key, new_blocks[i] = block);
            if (key in old_indexes)
                deltas.set(key, Math.abs(i - old_indexes[key]));
        }
        const will_move = new Set();
        const did_move = new Set();
        function insert(block) {
            transition_in(block, 1);
            block.m(node, next);
            lookup.set(block.key, block);
            next = block.first;
            n--;
        }
        while (o && n) {
            const new_block = new_blocks[n - 1];
            const old_block = old_blocks[o - 1];
            const new_key = new_block.key;
            const old_key = old_block.key;
            if (new_block === old_block) {
                // do nothing
                next = new_block.first;
                o--;
                n--;
            }
            else if (!new_lookup.has(old_key)) {
                // remove old block
                destroy(old_block, lookup);
                o--;
            }
            else if (!lookup.has(new_key) || will_move.has(new_key)) {
                insert(new_block);
            }
            else if (did_move.has(old_key)) {
                o--;
            }
            else if (deltas.get(new_key) > deltas.get(old_key)) {
                did_move.add(new_key);
                insert(new_block);
            }
            else {
                will_move.add(old_key);
                o--;
            }
        }
        while (o--) {
            const old_block = old_blocks[o];
            if (!new_lookup.has(old_block.key))
                destroy(old_block, lookup);
        }
        while (n)
            insert(new_blocks[n - 1]);
        return new_blocks;
    }
    function validate_each_keys(ctx, list, get_context, get_key) {
        const keys = new Set();
        for (let i = 0; i < list.length; i++) {
            const key = get_key(get_context(ctx, list, i));
            if (keys.has(key)) {
                throw new Error(`Cannot have duplicate keys in a keyed each`);
            }
            keys.add(key);
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const prop_values = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.29.0' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev("SvelteDOMInsert", { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev("SvelteDOMInsert", { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev("SvelteDOMRemove", { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ["capture"] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev("SvelteDOMAddEventListener", { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev("SvelteDOMRemoveEventListener", { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev("SvelteDOMRemoveAttribute", { node, attribute });
        else
            dispatch_dev("SvelteDOMSetAttribute", { node, attribute, value });
    }
    function prop_dev(node, property, value) {
        node[property] = value;
        dispatch_dev("SvelteDOMSetProperty", { node, property, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev("SvelteDOMSetData", { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error(`'target' is a required option`);
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn(`Component was already destroyed`); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    function createCommonjsModule(fn, basedir, module) {
    	return module = {
    	  path: basedir,
    	  exports: {},
    	  require: function (path, base) {
          return commonjsRequire(path, (base === undefined || base === null) ? module.path : base);
        }
    	}, fn(module, module.exports), module.exports;
    }

    function commonjsRequire () {
    	throw new Error('Dynamic requires are not currently supported by @rollup/plugin-commonjs');
    }

    var classnames = createCommonjsModule(function (module) {
    /*!
      Copyright (c) 2017 Jed Watson.
      Licensed under the MIT License (MIT), see
      http://jedwatson.github.io/classnames
    */
    /* global define */

    (function () {

    	var hasOwn = {}.hasOwnProperty;

    	function classNames () {
    		var classes = [];

    		for (var i = 0; i < arguments.length; i++) {
    			var arg = arguments[i];
    			if (!arg) continue;

    			var argType = typeof arg;

    			if (argType === 'string' || argType === 'number') {
    				classes.push(arg);
    			} else if (Array.isArray(arg) && arg.length) {
    				var inner = classNames.apply(null, arg);
    				if (inner) {
    					classes.push(inner);
    				}
    			} else if (argType === 'object') {
    				for (var key in arg) {
    					if (hasOwn.call(arg, key) && arg[key]) {
    						classes.push(key);
    					}
    				}
    			}
    		}

    		return classes.join(' ');
    	}

    	if ( module.exports) {
    		classNames.default = classNames;
    		module.exports = classNames;
    	} else {
    		window.classNames = classNames;
    	}
    }());
    });

    /* src/components/Display/Display.svelte generated by Svelte v3.29.0 */

    const file = "src/components/Display/Display.svelte";

    function create_fragment(ctx) {
    	let section;
    	let div1;
    	let div0;
    	let t_value = (/*warning*/ ctx[1] || /*displayValue*/ ctx[0]) + "";
    	let t;

    	const block = {
    		c: function create() {
    			section = element("section");
    			div1 = element("div");
    			div0 = element("div");
    			t = text(t_value);
    			attr_dev(div0, "class", "display svelte-4mlyfl");
    			add_location(div0, file, 32, 4, 652);
    			attr_dev(div1, "class", "display-inner svelte-4mlyfl");
    			add_location(div1, file, 31, 2, 620);
    			attr_dev(section, "class", "display-container svelte-4mlyfl");
    			attr_dev(section, "role", "region");
    			add_location(section, file, 30, 0, 568);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, section, anchor);
    			append_dev(section, div1);
    			append_dev(div1, div0);
    			append_dev(div0, t);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*warning, displayValue*/ 3 && t_value !== (t_value = (/*warning*/ ctx[1] || /*displayValue*/ ctx[0]) + "")) set_data_dev(t, t_value);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(section);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Display", slots, []);
    	let { displayValue = "" } = $$props;
    	let { warning = null } = $$props;
    	const writable_props = ["displayValue", "warning"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Display> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("displayValue" in $$props) $$invalidate(0, displayValue = $$props.displayValue);
    		if ("warning" in $$props) $$invalidate(1, warning = $$props.warning);
    	};

    	$$self.$capture_state = () => ({ displayValue, warning });

    	$$self.$inject_state = $$props => {
    		if ("displayValue" in $$props) $$invalidate(0, displayValue = $$props.displayValue);
    		if ("warning" in $$props) $$invalidate(1, warning = $$props.warning);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [displayValue, warning];
    }

    class Display extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, { displayValue: 0, warning: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Display",
    			options,
    			id: create_fragment.name
    		});
    	}

    	get displayValue() {
    		throw new Error("<Display>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set displayValue(value) {
    		throw new Error("<Display>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get warning() {
    		throw new Error("<Display>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set warning(value) {
    		throw new Error("<Display>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/Button/Button.svelte generated by Svelte v3.29.0 */
    const file$1 = "src/components/Button/Button.svelte";

    function create_fragment$1(ctx) {
    	let button;
    	let t;
    	let button_class_value;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			t = text(/*text*/ ctx[0]);
    			attr_dev(button, "id", /*id*/ ctx[1]);
    			attr_dev(button, "class", button_class_value = "" + (null_to_empty(classnames("button", /*className*/ ctx[2], /*highlighted*/ ctx[6] && "highlighted")) + " svelte-92ql27"));
    			attr_dev(button, "title", /*title*/ ctx[3]);
    			button.value = /*value*/ ctx[4];
    			add_location(button, file$1, 37, 0, 785);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, t);

    			if (!mounted) {
    				dispose = listen_dev(
    					button,
    					"click",
    					function () {
    						if (is_function(/*onClick*/ ctx[5])) /*onClick*/ ctx[5].apply(this, arguments);
    					},
    					false,
    					false,
    					false
    				);

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, [dirty]) {
    			ctx = new_ctx;
    			if (dirty & /*text*/ 1) set_data_dev(t, /*text*/ ctx[0]);

    			if (dirty & /*id*/ 2) {
    				attr_dev(button, "id", /*id*/ ctx[1]);
    			}

    			if (dirty & /*className, highlighted*/ 68 && button_class_value !== (button_class_value = "" + (null_to_empty(classnames("button", /*className*/ ctx[2], /*highlighted*/ ctx[6] && "highlighted")) + " svelte-92ql27"))) {
    				attr_dev(button, "class", button_class_value);
    			}

    			if (dirty & /*title*/ 8) {
    				attr_dev(button, "title", /*title*/ ctx[3]);
    			}

    			if (dirty & /*value*/ 16) {
    				prop_dev(button, "value", /*value*/ ctx[4]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Button", slots, []);
    	let { text } = $$props;
    	let { id } = $$props;
    	let { className } = $$props;
    	let { title } = $$props;
    	let { value = null } = $$props;
    	let { onClick } = $$props;
    	let { highlighted = false } = $$props;
    	const writable_props = ["text", "id", "className", "title", "value", "onClick", "highlighted"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Button> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("text" in $$props) $$invalidate(0, text = $$props.text);
    		if ("id" in $$props) $$invalidate(1, id = $$props.id);
    		if ("className" in $$props) $$invalidate(2, className = $$props.className);
    		if ("title" in $$props) $$invalidate(3, title = $$props.title);
    		if ("value" in $$props) $$invalidate(4, value = $$props.value);
    		if ("onClick" in $$props) $$invalidate(5, onClick = $$props.onClick);
    		if ("highlighted" in $$props) $$invalidate(6, highlighted = $$props.highlighted);
    	};

    	$$self.$capture_state = () => ({
    		classnames,
    		text,
    		id,
    		className,
    		title,
    		value,
    		onClick,
    		highlighted
    	});

    	$$self.$inject_state = $$props => {
    		if ("text" in $$props) $$invalidate(0, text = $$props.text);
    		if ("id" in $$props) $$invalidate(1, id = $$props.id);
    		if ("className" in $$props) $$invalidate(2, className = $$props.className);
    		if ("title" in $$props) $$invalidate(3, title = $$props.title);
    		if ("value" in $$props) $$invalidate(4, value = $$props.value);
    		if ("onClick" in $$props) $$invalidate(5, onClick = $$props.onClick);
    		if ("highlighted" in $$props) $$invalidate(6, highlighted = $$props.highlighted);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [text, id, className, title, value, onClick, highlighted];
    }

    class Button extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {
    			text: 0,
    			id: 1,
    			className: 2,
    			title: 3,
    			value: 4,
    			onClick: 5,
    			highlighted: 6
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Button",
    			options,
    			id: create_fragment$1.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*text*/ ctx[0] === undefined && !("text" in props)) {
    			console.warn("<Button> was created without expected prop 'text'");
    		}

    		if (/*id*/ ctx[1] === undefined && !("id" in props)) {
    			console.warn("<Button> was created without expected prop 'id'");
    		}

    		if (/*className*/ ctx[2] === undefined && !("className" in props)) {
    			console.warn("<Button> was created without expected prop 'className'");
    		}

    		if (/*title*/ ctx[3] === undefined && !("title" in props)) {
    			console.warn("<Button> was created without expected prop 'title'");
    		}

    		if (/*onClick*/ ctx[5] === undefined && !("onClick" in props)) {
    			console.warn("<Button> was created without expected prop 'onClick'");
    		}
    	}

    	get text() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set text(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get id() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set id(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get className() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set className(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get title() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set title(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get value() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set value(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get onClick() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set onClick(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get highlighted() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set highlighted(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    const config = [
        {
            className: 'row--full',
            config: [{ id: 'clear', title: 'Clear', text: 'AC', value: 'clear' }],
        },
        {
            config: [
                { id: 'seven', title: 'Seven', text: '7', value: 7 },
                { id: 'eight', title: 'Eight', text: '8', value: 8 },
                { id: 'nine', title: 'Nine', text: '9', value: 9 },
                { id: 'divide', title: 'Divide', text: '/', value: '/' },
            ],
        },
        {
            config: [
                { id: 'four', title: 'Four', text: '4', value: 4 },
                { id: 'five', title: 'Five', text: '5', value: 5 },
                { id: 'six', title: 'Six', text: '6', value: 6 },
                { id: 'multiply', title: 'Multiply', text: '*', value: '*' },
            ],
        },
        {
            config: [
                { id: 'one', title: 'One', text: '1', value: 1 },
                { id: 'two', title: 'Two', text: '2', value: 2 },
                { id: 'three', title: 'Three', text: '3', value: 3 },
                { id: 'subtract', title: 'Subtract', text: '-', value: '-' },
            ],
        },
        {
            config: [
                { id: 'zero', title: 'Zero', text: '0', value: 0 },
                { id: 'decimal', title: 'Decimal', text: '.', value: '.' },
                {
                    id: 'equals',
                    title: 'Equals',
                    text: '=',
                    value: '=',
                    className: 'button--equals',
                },
                { id: 'add', title: 'Add', text: '+', value: '+' },
            ],
        },
    ];

    // operation handlers
    const operationHandlers = {
        '+': (a, b) => a + b,
        '-': (a, b) => a - b,
        '*': (a, b) => a * b,
        '/': (a, b) => a / b,
    };
    // utils
    const isNumber = (val) => typeof val === 'number';
    const isValidNumber = (val) => !isNaN(val);
    const isDigit = (char) => /[0-9]/.test(String(char));
    const isString = (val) => typeof val === 'string';
    const isOperator = (val) => /[\+\-\*\/]/.test(String(val));
    const suffix = (prevVal, newVal) => {
        return `${prevVal}${newVal}`;
    };
    const mergeNumbers = (prevVal, newVal) => {
        const updatedNum = suffix(prevVal, newVal);
        return Number(updatedNum);
    };
    const suffixDecimal = (prevVal, newVal) => {
        return suffix(prevVal, newVal);
    };

    /* src/containers/Calculator/Calculator.svelte generated by Svelte v3.29.0 */

    const { Object: Object_1 } = globals;

    const file$2 = "src/containers/Calculator/Calculator.svelte";

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[17] = list[i].id;
    	child_ctx[18] = list[i].value;
    	child_ctx[19] = list[i].title;
    	child_ctx[20] = list[i].className;
    	child_ctx[21] = list[i].text;
    	return child_ctx;
    }

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[13] = list[i].className;
    	child_ctx[14] = list[i].config;
    	return child_ctx;
    }

    // (320:8) {#each rowConfig as { id, value, title, className, text }
    function create_each_block_1(key_1, ctx) {
    	let first;
    	let button;
    	let current;

    	function func(...args) {
    		return /*func*/ ctx[5](/*value*/ ctx[18], ...args);
    	}

    	button = new Button({
    			props: {
    				id: /*id*/ ctx[17],
    				title: /*title*/ ctx[19],
    				className: classnames(/*className*/ ctx[20]),
    				text: /*text*/ ctx[21],
    				value: /*value*/ ctx[18],
    				onClick: func,
    				highlighted: /*activeKey*/ ctx[0] === /*value*/ ctx[18]
    			},
    			$$inline: true
    		});

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			first = empty();
    			create_component(button.$$.fragment);
    			this.first = first;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, first, anchor);
    			mount_component(button, target, anchor);
    			current = true;
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			const button_changes = {};
    			if (dirty & /*activeKey*/ 1) button_changes.highlighted = /*activeKey*/ ctx[0] === /*value*/ ctx[18];
    			button.$set(button_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(button.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(button.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(first);
    			destroy_component(button, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(320:8) {#each rowConfig as { id, value, title, className, text }",
    		ctx
    	});

    	return block;
    }

    // (318:4) {#each config as { className: rowClassName, config: rowConfig }}
    function create_each_block(ctx) {
    	let div;
    	let each_blocks = [];
    	let each_1_lookup = new Map();
    	let t;
    	let div_class_value;
    	let current;
    	let each_value_1 = /*rowConfig*/ ctx[14];
    	validate_each_argument(each_value_1);
    	const get_key = ctx => /*id*/ ctx[17];
    	validate_each_keys(ctx, each_value_1, get_each_context_1, get_key);

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		let child_ctx = get_each_context_1(ctx, each_value_1, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block_1(key, child_ctx));
    	}

    	const block = {
    		c: function create() {
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t = space();
    			attr_dev(div, "class", div_class_value = "" + (null_to_empty(classnames("row", /*rowClassName*/ ctx[13])) + " svelte-1hyyoi6"));
    			add_location(div, file$2, 318, 6, 11017);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}

    			append_dev(div, t);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*config, classnames, handleButtonClick, activeKey*/ 9) {
    				const each_value_1 = /*rowConfig*/ ctx[14];
    				validate_each_argument(each_value_1);
    				group_outros();
    				validate_each_keys(ctx, each_value_1, get_each_context_1, get_key);
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value_1, each_1_lookup, div, outro_and_destroy_block, create_each_block_1, t, get_each_context_1);
    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value_1.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].d();
    			}
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(318:4) {#each config as { className: rowClassName, config: rowConfig }}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let div1;
    	let div0;
    	let display;
    	let t;
    	let current;
    	let mounted;
    	let dispose;

    	display = new Display({
    			props: {
    				displayValue: /*displayValue*/ ctx[2],
    				warning: /*warning*/ ctx[1]
    			},
    			$$inline: true
    		});

    	let each_value = config;
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			create_component(display.$$.fragment);
    			t = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div0, "class", "calculator-inner svelte-1hyyoi6");
    			add_location(div0, file$2, 315, 2, 10870);
    			attr_dev(div1, "class", "calculator svelte-1hyyoi6");
    			add_location(div1, file$2, 314, 0, 10843);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			mount_component(display, div0, null);
    			append_dev(div0, t);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div0, null);
    			}

    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(window, "keydown", /*handleKeydown*/ ctx[4], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			const display_changes = {};
    			if (dirty & /*displayValue*/ 4) display_changes.displayValue = /*displayValue*/ ctx[2];
    			if (dirty & /*warning*/ 2) display_changes.warning = /*warning*/ ctx[1];
    			display.$set(display_changes);

    			if (dirty & /*classnames, config, handleButtonClick, activeKey*/ 9) {
    				each_value = config;
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(div0, null);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(display.$$.fragment, local);

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(display.$$.fragment, local);
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			destroy_component(display);
    			destroy_each(each_blocks, detaching);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }


    const toFixedDigits = 10;

    const computeValue = stack => {
    	const output = stack.reduce(
    		(acc, next, i) => {
    			const asNumber = Number(next);

    			if (isValidNumber(asNumber)) {
    				if (i === 0) return asNumber;
    				const lastOperation = stack[i - 1];
    				return operationHandlers[lastOperation](acc, asNumber);
    			}

    			return acc;
    		},
    		0
    	);

    	// round to fixed number of digits
    	return Number(output.toFixed(toFixedDigits));
    };

    const getDisplayValue = stack => {
    	if (!stack.length) return "0";

    	return stack.map(val => {
    		if (isNumber(val)) {
    			return Math.min(val, Number.MAX_SAFE_INTEGER);
    		}

    		return val;
    	}).join(" ");
    };

    const highlightedTimeout = 125;
    const warningTimeout = 1500;

    function instance$2($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Calculator", slots, []);
    	let stack = [];
    	let activeKey = null;
    	let warning = null;
    	let highlightedTimeoutId = null;
    	let warningTimeoutId = null;

    	const handleDigitOperation = newOperation => {
    		const lastOperation = stack[stack.length - 1];
    		const secondLastOperation = stack[stack.length - 2];
    		const lastOperationIsANumber = isValidNumber(Number(lastOperation));
    		const lastOperationIsAnOperator = isOperator(lastOperation);
    		const lastOperationIsAString = isString(lastOperation);
    		const secondLastOperationIsAnOperator = isOperator(secondLastOperation);
    		const hasComputedResult = secondLastOperation === "=";

    		if (hasComputedResult) {
    			// start a new stack with a new number
    			// e.g. [12, '/', 4, '=', 3] --> [5]
    			$$invalidate(6, stack = [newOperation]);

    			return;
    		}

    		if (lastOperationIsANumber) {
    			// track temporary string decimal representations,
    			// which are useful for maintaining a trailing '.'
    			if (lastOperationIsAString) {
    				// if the new operation is 0, do not coerce the full value to a number yet.
    				// it still needs to be a string, or it will be pared down prematurely
    				let valueToAppend;

    				// e.g. ['123.'] --> ['123.0']
    				valueToAppend = suffix(lastOperation, newOperation);

    				if (newOperation > 0) {
    					// a non-zero value can be coerced to a number
    					// e.g. ['123.'] --> [123.4]
    					valueToAppend = Number(valueToAppend);
    				}

    				$$invalidate(6, stack[stack.length - 1] = valueToAppend, stack);
    				return;
    			}

    			// prevent consecutive 0 digits unless position is valid
    			// e.g. [0] --> [0] (no change)
    			if (lastOperation === 0 && newOperation === 0) return;

    			// just merge consecutive numerical values otherwise
    			// e.g. [20] --> [200]
    			const newNum = mergeNumbers(lastOperation, Number(newOperation));

    			// ^ TODO: figure out why TS is complaining about newOperation despite type guard inside `isDigit`
    			const safeNum = Math.min(newNum, Number.MAX_SAFE_INTEGER);

    			$$invalidate(6, stack[stack.length - 1] = safeNum, stack);

    			if (safeNum === Number.MAX_SAFE_INTEGER) {
    				$$invalidate(1, warning = "Digit limit reached");
    			}

    			return;
    		}

    		if (lastOperationIsAnOperator) {
    			if (lastOperation === "-" && secondLastOperationIsAnOperator) {
    				// accommmodate '-' after another operator (for negative numbers)
    				// e.g. [12345, '/', '-'] --> [12345, '/', -3]
    				$$invalidate(6, stack[stack.length - 1] = Number(suffix(lastOperation, newOperation)), stack);
    			} else {
    				// else just add the new number to the stack
    				// e.g. [12345, '/'] --> [12345, '/', 3]
    				$$invalidate(6, stack = [...stack, newOperation]);
    			}

    			return;
    		}
    	};

    	const handleDecimalOperation = newOperation => {
    		const lastOperation = stack[stack.length - 1];
    		const lastOperationIsANumber = isValidNumber(Number(lastOperation));
    		const lastOperationIsAnOperator = isOperator(lastOperation);

    		if (lastOperationIsANumber) {
    			// ignore if the last number is already a decimal
    			// e.g. [12.34] --> [12.34] (no change)
    			if (Math.round(Number(lastOperation)) !== lastOperation) return;

    			// EDGE CASE: value being converted to decimal is -0,
    			// which otherwise gets coerced to '0'
    			if (Object.is(lastOperation, -0)) {
    				// so this retains the negative value
    				// e.g. [-0] --> ['-0.']
    				$$invalidate(6, stack[stack.length - 1] = suffix("-0", newOperation), stack);
    			} else {
    				// else we just string concatenate the decimal and the number
    				// e.g. [123] --> ['123.']
    				$$invalidate(6, stack[stack.length - 1] = suffixDecimal(lastOperation, newOperation), stack);
    			}

    			return;
    		}

    		if (lastOperationIsAnOperator) {
    			// e.g. [12, '/'] --> [12, '/', '0.']
    			$$invalidate(6, stack = [...stack, suffixDecimal(0, newOperation)]);

    			return;
    		}
    	};

    	const handleOperatorOperation = newOperation => {
    		const lastOperation = stack[stack.length - 1];
    		const secondLastOperation = stack[stack.length - 2];
    		const lastOperationIsANumber = isValidNumber(Number(lastOperation));
    		const lastOperationIsAnOperator = isOperator(lastOperation);
    		const secondLastOperationIsAnOperator = isOperator(secondLastOperation);
    		const hasComputedResult = secondLastOperation === "=";
    		const newOperationIsSubtract = newOperation === "-";
    		const lastOperationIsSubtract = lastOperation === "-";
    		const lastOperationIsAdd = lastOperation === "+";

    		if (hasComputedResult) {
    			// start new stack with the result
    			// e.g. [3, '*', 4, '=', 12] --> [12, '+']
    			$$invalidate(6, stack = [lastOperation, newOperation]);

    			return;
    		}

    		if (lastOperationIsANumber) {
    			$$invalidate(6, stack = [...stack, newOperation]);
    			return;
    		}

    		if (lastOperationIsAnOperator) {
    			if (newOperationIsSubtract && lastOperationIsSubtract) {
    				// convert two consecutive '-' operators to '+'
    				// e.g. [1, '-'] --> [1, '+']
    				$$invalidate(6, stack[stack.length - 1] = "+", stack);
    			} else if (newOperationIsSubtract && lastOperationIsAdd) {
    				// e.g. [1, '+'] --> [1, '-']
    				$$invalidate(6, stack[stack.length - 1] = "-", stack);
    			} else if (newOperationIsSubtract) {
    				// e.g. [1] --> [1, '-']
    				$$invalidate(6, stack = [...stack, newOperation]);
    			} else if (lastOperationIsSubtract && secondLastOperationIsAnOperator) {
    				// if lastOperation is '-' and is preceded by another operator
    				// overwrite both with the new operator
    				// e.g. [123, '/', '-'] --> [123, '*']
    				$$invalidate(6, stack = [...stack.slice(0, stack.length - 2), newOperation]);
    			} else {
    				// else just overwrite the last operator
    				// e.g. [123, '/'] --> [123, '*']
    				$$invalidate(6, stack[stack.length - 1] = newOperation, stack);
    			}
    		}
    	};

    	const handleEqualsOperation = newOperation => {
    		const lastOperation = stack[stack.length - 1];
    		const secondLastOperation = stack[stack.length - 2];
    		const lastOperationIsAnOperator = isOperator(lastOperation);
    		const lastOperationIsANumber = isValidNumber(Number(lastOperation));
    		const hasComputedResult = secondLastOperation === "=";

    		// ignore duplicate operation
    		// e.g. [1, '+', 1, '=', 2] --> [1, '+', 1, '=', 2] (no change)
    		if (hasComputedResult) return;

    		if (lastOperationIsAnOperator) {
    			// replace the previous operator, then compute
    			// e.g. [1, '+', 1, '/'] --> [1, '+', 1, '=', 2]
    			const result = computeValue(stack);

    			$$invalidate(6, stack = [...stack.slice(0, stack.length - 1), newOperation, result]);
    			return;
    		}

    		if (lastOperationIsANumber) {
    			// otherwise just compute the result
    			// e.g. [1, '+', 1, '=', 2] --> [1, '+', 1, '=', 2]
    			const result = computeValue(stack);

    			$$invalidate(6, stack = [...stack, newOperation, result]);
    		}
    	};

    	const handleButtonClick = newOperation => {
    		if (newOperation === "clear") {
    			$$invalidate(6, stack = []);
    			return;
    		}

    		if (!stack.length) {
    			if (isNumber(newOperation)) {
    				$$invalidate(6, stack = [newOperation]);
    			}

    			return;
    		}

    		if (newOperation === "=") {
    			handleEqualsOperation(newOperation);
    			return;
    		}

    		if (isDigit(newOperation)) {
    			handleDigitOperation(newOperation);
    			return;
    		}

    		if (newOperation === ".") {
    			handleDecimalOperation(newOperation);
    			return;
    		}

    		if (isOperator(newOperation)) {
    			handleOperatorOperation(newOperation);
    			return;
    		}
    	};

    	const handleKeydown = e => {
    		let valueToHandle = null;

    		if (isDigit(e.key)) {
    			valueToHandle = Number(e.key);
    		} else if ((/[\/\*\-\+\=]/).test(e.key)) {
    			valueToHandle = e.key;
    		} else if (e.key === "Enter") {
    			valueToHandle = "=";
    		} else if (e.key === "Escape") {
    			valueToHandle = "clear";
    		}

    		if (valueToHandle !== null) {
    			$$invalidate(0, activeKey = valueToHandle);
    			handleButtonClick(valueToHandle);
    		}
    	};

    	const writable_props = [];

    	Object_1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Calculator> was created with unknown prop '${key}'`);
    	});

    	const func = value => handleButtonClick(value);

    	$$self.$capture_state = () => ({
    		toFixedDigits,
    		computeValue,
    		getDisplayValue,
    		classnames,
    		Display,
    		Button,
    		config,
    		isNumber,
    		isDigit,
    		isValidNumber,
    		isString,
    		isOperator,
    		suffix,
    		mergeNumbers,
    		suffixDecimal,
    		operationHandlers,
    		stack,
    		activeKey,
    		warning,
    		highlightedTimeoutId,
    		highlightedTimeout,
    		warningTimeoutId,
    		warningTimeout,
    		handleDigitOperation,
    		handleDecimalOperation,
    		handleOperatorOperation,
    		handleEqualsOperation,
    		handleButtonClick,
    		handleKeydown,
    		displayValue
    	});

    	$$self.$inject_state = $$props => {
    		if ("stack" in $$props) $$invalidate(6, stack = $$props.stack);
    		if ("activeKey" in $$props) $$invalidate(0, activeKey = $$props.activeKey);
    		if ("warning" in $$props) $$invalidate(1, warning = $$props.warning);
    		if ("highlightedTimeoutId" in $$props) $$invalidate(7, highlightedTimeoutId = $$props.highlightedTimeoutId);
    		if ("warningTimeoutId" in $$props) $$invalidate(8, warningTimeoutId = $$props.warningTimeoutId);
    		if ("displayValue" in $$props) $$invalidate(2, displayValue = $$props.displayValue);
    	};

    	let displayValue;

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*stack*/ 64) {
    			 $$invalidate(2, displayValue = getDisplayValue(stack));
    		}

    		if ($$self.$$.dirty & /*activeKey, highlightedTimeoutId*/ 129) {
    			 {
    				if (activeKey !== null) {
    					$$invalidate(7, highlightedTimeoutId = setTimeout(
    						() => {
    							$$invalidate(0, activeKey = null);
    						},
    						highlightedTimeout
    					));
    				} else {
    					clearTimeout(highlightedTimeoutId);
    				}
    			}
    		}

    		if ($$self.$$.dirty & /*warning, warningTimeoutId*/ 258) {
    			 {
    				if (warning !== null) {
    					$$invalidate(8, warningTimeoutId = setTimeout(
    						() => {
    							$$invalidate(1, warning = null);
    						},
    						warningTimeout
    					));
    				} else {
    					clearTimeout(warningTimeoutId);
    				}
    			}
    		}
    	};

    	return [activeKey, warning, displayValue, handleButtonClick, handleKeydown, func];
    }

    class Calculator extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Calculator",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

    /* src/App.svelte generated by Svelte v3.29.0 */
    const file$3 = "src/App.svelte";

    function create_fragment$3(ctx) {
    	let main;
    	let calculator;
    	let current;
    	calculator = new Calculator({ $$inline: true });

    	const block = {
    		c: function create() {
    			main = element("main");
    			create_component(calculator.$$.fragment);
    			add_location(main, file$3, 3, 0, 97);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			mount_component(calculator, main, null);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(calculator.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(calculator.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_component(calculator);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("App", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ Calculator });
    	return [];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$3.name
    		});
    	}
    }

    const app = new App({
        target: document.body
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
