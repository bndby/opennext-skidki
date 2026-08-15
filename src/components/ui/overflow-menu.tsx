"use client";

import {
	createContext,
	useContext,
	useEffect,
	useId,
	useRef,
	useState,
	type ChangeEvent,
	type ReactNode,
} from "react";

const OverflowMenuContext = createContext<() => void>(() => undefined);

type OverflowMenuProps = {
	label: string;
	children: ReactNode;
};

export function OverflowMenu({ label, children }: OverflowMenuProps) {
	const [open, setOpen] = useState(false);
	const rootRef = useRef<HTMLDivElement | null>(null);
	const menuId = useId();
	const close = () => setOpen(false);

	useEffect(() => {
		if (!open) {
			return;
		}

		function onPointerDown(event: PointerEvent) {
			if (!rootRef.current?.contains(event.target as Node)) {
				setOpen(false);
			}
		}

		function onKeyDown(event: KeyboardEvent) {
			if (event.key === "Escape") {
				setOpen(false);
			}
		}

		document.addEventListener("pointerdown", onPointerDown);
		document.addEventListener("keydown", onKeyDown);
		return () => {
			document.removeEventListener("pointerdown", onPointerDown);
			document.removeEventListener("keydown", onKeyDown);
		};
	}, [open]);

	return (
		<OverflowMenuContext.Provider value={close}>
			<div className="overflow-menu" ref={rootRef}>
				<button
					type="button"
					className="icon-btn"
					aria-label={label}
					aria-haspopup="menu"
					aria-expanded={open}
					aria-controls={menuId}
					onClick={() => setOpen((value) => !value)}
				>
					<svg className="icon-btn__svg" viewBox="0 0 24 24" fill="none" aria-hidden="true">
						<circle cx="12" cy="5.5" r="1.5" fill="currentColor" />
						<circle cx="12" cy="12" r="1.5" fill="currentColor" />
						<circle cx="12" cy="18.5" r="1.5" fill="currentColor" />
					</svg>
				</button>
				{open ? (
					<div className="menu-surface" id={menuId} role="menu">
						{children}
					</div>
				) : null}
			</div>
		</OverflowMenuContext.Provider>
	);
}

type MenuButtonProps = {
	children: ReactNode;
	onClick: () => void;
	disabled?: boolean;
};

export function MenuButton({ children, onClick, disabled }: MenuButtonProps) {
	const close = useContext(OverflowMenuContext);

	return (
		<button
			type="button"
			className="menu-surface__item"
			role="menuitem"
			disabled={disabled}
			onClick={() => {
				close();
				onClick();
			}}
		>
			{children}
		</button>
	);
}

type MenuFileItemProps = {
	children: ReactNode;
	accept: string;
	disabled?: boolean;
	onChange: (event: ChangeEvent<HTMLInputElement>) => void;
};

export function MenuFileItem({ children, accept, disabled, onChange }: MenuFileItemProps) {
	const close = useContext(OverflowMenuContext);

	return (
		<label className={`menu-surface__item ${disabled ? "menu-surface__item--disabled" : ""}`}>
			{children}
			<input
				type="file"
				accept={accept}
				className="sr-only"
				disabled={disabled}
				onChange={(event) => {
					close();
					onChange(event);
				}}
			/>
		</label>
	);
}
