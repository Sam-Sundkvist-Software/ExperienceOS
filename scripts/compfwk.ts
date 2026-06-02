import { XP_API } from "./api";

export interface CreateElementOptions<T extends keyof HTMLElementTagNameMap> {
    tag: T;
    type?: string;
    id?: string | undefined;
    className?: string | undefined;
    style?: Partial<CSSStyleDeclaration> | undefined;
    placeholder?: string;
    innerHTML?: string;
    innerText?: string;
    tooltip?: string;
    contextMenu?: MenuItem[];
    onClick?: () => void;
    onPointerDown?: (this: GlobalEventHandlers, ev: PointerEvent) => void;
}

export interface MenuItem {
    separator?: boolean;
    icon?: string;
    text?: string;
    menu?: MenuItem[];
    onClick?: () => void;
    action?: () => void;
}

interface TreeNode {
    text: string;
    children?: TreeNode[];
}

export function showContextMenu(x: number, y: number, items: MenuItem[]) {
    if (!items || items.length === 0) return;
    
    const existing = document.querySelector('.fccf-menu.context-menu');
    if (existing)
        existing.remove();

    // Close start menu when a context menu is shown
    // trash-- very hacky. 
    // TODO: refactor, make focus-based, not hardcoded.
    const startMenu = document.getElementById('start-menu');
    if (startMenu && startMenu.classList.contains('open')) {
        startMenu.classList.remove('open');
    }

    const menu = FCCF.Controls.Menu({ items: items });
    menu.el.classList.add('context-menu');
    document.body.appendChild(menu.el);
    menu.show(x, y);
}

export function createElement<T extends keyof HTMLElementTagNameMap>(options: CreateElementOptions<T>) {
    const el = document.createElement(options.tag);
    if (options.id) el.id = options.id;
    if (options.className) el.className = options.className;
    if (options.style) {
        Object.assign(el.style, options.style);
    }
    if (options.innerHTML) el.innerHTML = options.innerHTML;
    if (options.innerText) el.innerText = options.innerText;
    
    if (options.tooltip) {
        XP_API.showTooltip(el, typeof options.tooltip === 'string' ? { text: options.tooltip } : options.tooltip);
    }

    if (options.contextMenu) {
        el.oncontextmenu = (ev) => {
            ev.preventDefault();
            ev.stopPropagation();
            showContextMenu(ev.clientX, ev.clientY, options.contextMenu || []);
        };
    }

    if (options.onClick)
        el.onclick = () => options.onClick;
    if (options.onPointerDown)
        el.onpointerdown = options.onPointerDown;

    return el;
}

export const cf =() => {
    return FCCF;
}

type StateUpdater<T> = T | ((prevState: T) => T);

/* FakeXP Central Component Framework (FCCF) */
export const FCCF = (() => {
    const registry = () => XP_API.Registry;

    // Internal styling helper
    const applyStyles = (el: HTMLElement, styles: Partial<CSSStyleDeclaration>) => {
        if (styles) Object.assign(el.style, styles);
    };

    return {
        // Hooks-like state management
        useState: <T>(initialValue: T): [
            () => T,
            (value: StateUpdater<T>) => void,
            (fn: (state: T) => void) => () => boolean
        ] => {
            let state = initialValue;
            const listeners = new Set<(state: T) => void>();
            const setter = (newValue: StateUpdater<T>) => {
                state = typeof newValue === "function" ? (newValue as (prevState: T) => T)(state) : newValue;
                listeners.forEach(fn => fn(state));
            };
            const subscribe = (fn: (state: T) => void) => {
                listeners.add(fn);
                return () => listeners.delete(fn);
            };
            return [() => state, setter, subscribe];
        },

        // Core UI Components
        Controls: {
            // Layout Container
            Pane: (options: {
                className?: string;
                style?: Partial<CSSStyleDeclaration>;
                children?: Node[];
            }) => {
                const el = document.createElement('div');
                el.className = `fccf-pane ${options.className || ''}`;
                if (options.style)
                    applyStyles(el, options.style);
                if (options.children)
                    options.children.forEach(c => el.appendChild(c));
                return el;
            },

            // Standard XP Button
            Button: (options: {
                className?: string;
                text?: string;
                style?: Partial<CSSStyleDeclaration>;
                onClick?: () => void;
                contextMenu?: MenuItem[];
                disabled?: boolean;
            }) => {
                const btn = createElement({
                    tag: 'button',
                    className: `xp-button ${options.className || ''}`,
                    innerText: options.text || '',
                    style: options.style,
                    onClick: options.onClick,
                    contextMenu: options.contextMenu || [
                        { text: 'Click', action: options.onClick }
                    ]
                });
                if (options.disabled) btn.disabled = true;
                return btn;
            },

            // Text Input
            Input: (options: {
                className?: string;
                style?: Partial<CSSStyleDeclaration>;
                contextMenu?: MenuItem[];
                type?: string;
                value?: string;
                onChange?: (value: string) => void;
            }) => {
                const input = createElement({
                    tag: 'input',
                    className: `fccf-input ${options.className || ''}`,
                    style: options.style,
                    contextMenu: options.contextMenu || [
                        { text: 'Cut', action: () => { document.execCommand('cut'); } }, // TODO: USE CLIPBOARDAPI!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
                        { text: 'Copy', action: () => { document.execCommand('copy'); } },
                        { text: 'Paste', action: () => { document.execCommand('paste'); } }
                    ]
                });
                input.type = options.type || 'text';
                input.value = options.value || '';
                if (options.onChange)
                    input.oninput = (ev) => options.onChange?.(input.value);
                return input;
            },

            // Progress Bar
            ProgressBar: (options: {
                value?: number;
            }) => {
                const container = document.createElement('div');
                container.className = 'fccf-progress-container';
                const bar = document.createElement('div');
                bar.className = 'fccf-progress-bar';
                container.appendChild(bar);
                
                const setProgress = (val: number) => {
                    bar.style.width = `${Math.min(100, Math.max(0, val))}%`;
                };
                setProgress(options.value || 0);
                
                return { el: container, setProgress };
            },

            // List View
            List: (options: {
                className?: string;
                style?: Partial<CSSStyleDeclaration>;
                items?: (string | HTMLElement)[];
                onItemClick?: (item: string) => void;
            }) => {
                const ul = document.createElement('ul');
                ul.className = `fccf-list ${options.className || ''}`;
                if (options.style)
                    applyStyles(ul, options.style);
                
                const renderItems = (items: (string | HTMLElement)[]) => {
                    ul.innerHTML = '';
                    items.forEach(item => {
                        const li = document.createElement('li');
                        li.className = 'fccf-list-item';
                        if (typeof item === 'string') {
                            li.innerText = item;
                        } else {
                            li.appendChild(item);
                        }
                        if (options.onItemClick)
                            li.onclick = () => options.onItemClick?.(typeof item === "string" ? item! : item.textContent!);
                        ul.appendChild(li);
                    });
                };
                
                if (options.items)
                    renderItems(options.items);
                return { el: ul, update: renderItems };
            },

            // Grid View
            Grid: (options: {
                className?: string;
                cols?: number;
                /**
                 * CSS String
                 */
                gap?: string;
                style?: Partial<CSSStyleDeclaration>;
                children?: Node[];
            }) => {
                const el = document.createElement('div');
                el.className = `fccf-grid ${options.className || ''}`;
                applyStyles(el, {
                    display: 'grid',
                    gridTemplateColumns: `repeat(${options.cols || 3}, 1fr)`,
                    gap: options.gap || '10px',
                    ...options.style
                });
                if (options.children)
                    options.children.forEach(c => el.appendChild(c));
                return el;
            },

            // Link component
            Link: (options: {
                className?: string;
                href?: string;
                text?: string;
                style?: Partial<CSSStyleDeclaration>;
                onClick?: () => void;
            }) => {
                const a = document.createElement('a');
                a.className = `fccf-link ${options.className || ''}`;
                a.href = options.href || 'javascript:void(0)';
                a.innerText = options.text || '';
                applyStyles(a, {
                    color: '#0000ff',
                    textDecoration: 'underline',
                    cursor: 'pointer',
                    ...options.style
                });
                if (options.onClick) a.onclick = (e) => {
                    e.preventDefault();
                    options.onClick?.();
                };
                return a;
            },

            // Image component
            Image: (options: {
                className?: string;
                src?: string;
                alt?: string;
                style?: Partial<CSSStyleDeclaration>;
                onClick?: () => void;
            }) => {
                const img = document.createElement('img');
                img.className = `fccf-image ${options.className || ''}`;
                img.src = options.src || '';
                img.alt = options.alt || '';
                img.referrerPolicy = 'no-referrer';
                if (options.style)
                    applyStyles(img, options.style);
                if (options.onClick) img.onclick = options.onClick;
                return img;
            },

            // Icon component (Image with fixed size)
            Icon: (options: {
                className?: string;
                src?: string;
                alt?: string;
                style?: Partial<CSSStyleDeclaration>;
                onClick?: () => void;
                size?: string;
            }) => {
                return FCCF.Controls.Image({
                    ...options,
                    style: {
                        width: options.size || '32px',
                        height: options.size || '32px',
                        ...options.style
                    }
                });
            },

            // Dropdown (Select)
            Dropdown: (options: {
                className?: string;
                style?: Partial<CSSStyleDeclaration>;
                items?: { value: string; text: string; selected: boolean; }[] | (string | HTMLElement)[];
                value?: string;
                onChange?: (value: string) => void;
            }) => {
                const select = document.createElement('select');
                select.className = `fccf-dropdown ${options.className || ''}`;
                if (options.style)
                    applyStyles(select, options.style);
                if (options.items) {
                    options.items.forEach(item => {
                        const opt = document.createElement('option');
                        if (typeof item === "string") {
                            opt.value = item;
                            opt.innerText = item;
                        } else if (item instanceof HTMLElement) {
                            opt.value = item.textContent || "";
                            opt.innerText = item.textContent || "";
                        } else {
                            opt.value = item.value;
                            opt.innerText = item.text;
                            if (item.selected || options.value === opt.value) opt.selected = true;
                        }
                        
                        select.appendChild(opt);
                    });
                }
                if (options.onChange)
                    select.onchange = () => options.onChange?.(select.value);
                return select;
            },

            // Menu (Unified Drop-out and Context menu)
            Menu: (options: {
                style?: Partial<CSSStyleDeclaration>;
                items?: MenuItem[];
            }) => {
                const menu = document.createElement('div');
                menu.className = 'fccf-menu';
                applyStyles(menu, {
                    position: 'fixed',
                    background: '#fff',
                    border: '1px solid #aca899',
                    boxShadow: '2px 2px 3px rgba(0,0,0,0.3)',
                    zIndex: '20000',
                    minWidth: '150px',
                    display: 'none',
                    ...options.style
                });

                const renderItems = (items: MenuItem[]) => {
                    menu.innerHTML = '';
                    items.forEach(item => {
                        if (item.separator) {
                            const hr = document.createElement('hr');
                            hr.className = 'fccf-menu-separator';
                            menu.appendChild(hr);
                            return;
                        }
                        const el = document.createElement('div');
                        el.className = 'fccf-menu-item-dropdown';
                        
                        const icon = document.createElement('div');
                        icon.className = 'fccf-menu-item-icon';
                        if (item.icon) {
                            const img = document.createElement('img');
                            img.src = item.icon;
                            img.referrerPolicy = 'no-referrer';
                            icon.appendChild(img);
                        }
                        
                        const text = document.createElement('span');
                        text.innerText = item.text || "";
                        text.className = 'fccf-menu-item-text';
                        
                        el.appendChild(icon);
                        el.appendChild(text);

                        if (item.menu) {
                            const arrow = document.createElement('span');
                            arrow.innerText = '▶';
                            arrow.style.fontSize = '8px';
                            el.appendChild(arrow);
                            
                            // Submenu handling could be added here
                        }

                        if (item.onClick || item.action) {
                            el.onclick = (e) => {
                                e.stopPropagation();
                                if (item.onClick) item.onClick();
                                if (item.action) item.action();
                                menu.style.display = 'none';
                            };
                        }
                        
                        menu.appendChild(el);
                    });
                };

                if (options.items)
                    renderItems(options.items);
                
                const show = (x: number, y: number) => {
                    menu.style.left = x + 'px';
                    menu.style.top = y + 'px';
                    menu.style.display = 'block';
                    
                    // Boundary check
                    const rect = menu.getBoundingClientRect();
                    if (rect.right > window.innerWidth) menu.style.left = (window.innerWidth - rect.width) + 'px';
                    if (rect.bottom > window.innerHeight) menu.style.top = (window.innerHeight - rect.height) + 'px';

                    const hide = (ev: Event) => {
                        if (!menu.contains(ev.target as Node)) {
                            menu.style.display = 'none';
                            document.removeEventListener('mousedown', hide);
                        }
                    };
                    // Use setTimeout to avoid immediate trigger from the same event
                    setTimeout(() => {
                        document.addEventListener('mousedown', hide);
                    }, 10);
                };

                return { el: menu, show, update: renderItems };
            },

            // Splitter / Resizable Panel
            Splitter: (options: {
                vertical?: boolean;
                style?: Partial<CSSStyleDeclaration>;
                onResize?: (delta: number) => void;
            }) => {
                const splitter = document.createElement('div');
                splitter.className = `fccf-splitter ${options.vertical ? 'vertical' : 'horizontal'}`;
                const isVertical = !!options.vertical;
                
                applyStyles(splitter, {
                    background: '#aca899',
                    cursor: isVertical ? 'col-resize' : 'row-resize',
                    [isVertical ? 'width' : 'height']: '4px',
                    ...options.style
                });

                splitter.onmousedown = (ev) => {
                    ev.preventDefault();
                    let lastPos = isVertical ? ev.clientX : ev.clientY;
                    const onMouseMove = (moveEvent: PointerEvent) => {
                        const currentPos = isVertical ? moveEvent.clientX : moveEvent.clientY;
                        const delta = currentPos - lastPos;
                        lastPos = currentPos;
                        if (options.onResize)
                            options.onResize(delta);
                    };
                    const onMouseUp = () => {
                        document.removeEventListener("pointermove", onMouseMove);
                        document.removeEventListener("pointerup", onMouseUp);
                    };
                    document.addEventListener("pointermove", onMouseMove);
                    document.addEventListener("pointerup", onMouseUp);
                };

                return splitter;
            },

            // Menu Strip
            MenuStrip: (options: {
                items: MenuItem[];
            }) => {
                const nav = document.createElement('div');
                nav.className = 'fccf-menustrip';
                options.items.forEach(item => {
                    const btn = document.createElement('div');
                    btn.className = 'fccf-menu-item';
                    btn.innerText = item.text || "";
                    
                    if (item.menu) {
                        const menu = FCCF.Controls.Menu({ items: item.menu });
                        document.body.appendChild(menu.el);
                        btn.onclick = (e) => {
                            const rect = btn.getBoundingClientRect();
                            menu.show(rect.left, rect.bottom);
                        };
                    } else {
                        btn.onclick = () => item.onClick;
                    }
                    nav.appendChild(btn);
                });
                return nav;
            },

            /*
            
            */
            // Tree View (Simplified)
            Tree: (options: {
                data: TreeNode[];
                onNodeClick?: (node: TreeNode) => void;
            }) => {
                const container = document.createElement('div');
                container.className = 'fccf-tree';
                
                const renderNode = (node: TreeNode, parent: HTMLDivElement) => {
                    const item = document.createElement('div');
                    item.className = 'fccf-tree-node';
                    item.innerText = node.text;
                    item.onclick = (e) => {
                        e.stopPropagation();
                        if (options.onNodeClick) options.onNodeClick(node);
                    };
                    parent.appendChild(item);
                    
                    if (node.children) {
                        const sub = document.createElement('div');
                        sub.className = 'fccf-tree-sub';
                        node.children.forEach(child => renderNode(child, sub));
                        parent.appendChild(sub);
                    }
                };
                
                options.data.forEach(n => renderNode(n, container));
                return container;
            },

            // Slider
            Slider: (options: {
                min?: number;
                max?: number;
                value?: number;
                onChange?: (value: string) => void;
            }) => {
                const input = document.createElement('input');
                input.type = 'range';
                input.min = options.min + "" || 0 + "";
                input.max = options.max + "" || 100 + "";
                input.value = options.value + "" || 0 + "";
                input.className = 'fccf-slider';
                if (options.onChange) input.oninput = (e) => options.onChange?.(input.value);
                return input;
            },

            // Installer / Wizard component
            Installer: (options: {
                steps?: {
                    title?: string;
                    content?: string | Function | Node;
                }[];
                onCancel?: () => void;
                onFinish?: () => void;
            }) => {
                const [getStep, setStep, subscribeStep] = FCCF.useState(0);
                const steps = options.steps || [];
                
                const container = document.createElement('div');
                container.style.display = 'flex';
                container.style.flexDirection = 'column';
                container.style.height = '100%';
                
                const header = document.createElement('div');
                header.style.padding = '15px';
                header.style.background = 'white';
                header.style.borderBottom = '1px solid #ccc';
                header.style.fontWeight = 'bold';
                
                const body = document.createElement('div');
                body.style.flexGrow = '1';
                body.style.padding = '20px';
                body.style.overflow = 'auto';
                
                const footer = document.createElement('div');
                footer.style.padding = '10px';
                footer.style.background = '#f0f0f0';
                footer.style.borderTop = '1px solid #ccc';
                footer.style.display = 'flex';
                footer.style.justifyContent = 'flex-end';
                footer.style.gap = '10px';
                
                const backBtn = FCCF.Controls.Button({ text: '< Back', onClick: () => setStep(s => Math.max(0, s - 1)) });
                const nextBtn = FCCF.Controls.Button({ text: 'Next >', onClick: () => {
                    if (getStep() === steps.length - 1) {
                        if (options.onFinish)
                            options.onFinish();
                    } else {
                        setStep(s => s + 1);
                    }
                }});
                const cancelBtn = FCCF.Controls.Button({ text: 'Cancel', onClick: options.onCancel });
                
                footer.appendChild(backBtn);
                footer.appendChild(nextBtn);
                footer.appendChild(cancelBtn);
                
                container.appendChild(header);
                container.appendChild(body);
                container.appendChild(footer);
                
                const renderStep = (stepIdx: number) => {
                    const step = steps[stepIdx];
                    header.innerText = step.title || 'Setup';
                    body.innerHTML = '';
                    if (typeof step.content === 'string') {
                        body.innerText = step.content;
                    } else if (typeof step.content === 'function') {
                        body.appendChild(step.content());
                    } else if (!!step) {
                        body.appendChild(step.content as Node);
                    }
                    
                    backBtn.disabled = stepIdx === 0;
                    nextBtn.innerText = stepIdx === steps.length - 1 ? 'Finish' : 'Next >';
                };
                
                subscribeStep(renderStep);
                renderStep(0);
                
                return container;
            }
        },

        // Window Creation Wrapper
        Window: (options: {
            title?: string;
            width?: number;
            height?: number;
            content?: string | Node;
            onClose?: Function;
        }) => {
            const winOptions = {
                title: options.title || 'FCCF App',
                width: options.width || 400,
                height: options.height || 300,
                content: options.content,
                onClose: options.onClose
            };
            return XP_API.createWindow(winOptions);
        }
    };
})();
