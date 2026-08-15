"use client";

import Link from "next/link";
import type { ReactNode } from "react";

type TopAppBarProps = {
	title: string;
	subtitle?: string;
	backHref?: string;
	trailing?: ReactNode;
	large?: boolean;
};

export function TopAppBar({ title, subtitle, backHref, trailing, large = false }: TopAppBarProps) {
	return (
		<header className={`top-app-bar ${large ? "top-app-bar--large" : ""}`}>
			<div className="top-app-bar__row">
				{backHref ? (
					<Link href={backHref} className="icon-btn" aria-label="Назад">
						<svg className="icon-btn__svg" viewBox="0 0 24 24" fill="none" aria-hidden="true">
							<path
								d="M19 12H6m0 0 5.5-5.5M6 12l5.5 5.5"
								stroke="currentColor"
								strokeWidth="1.8"
								strokeLinecap="round"
								strokeLinejoin="round"
							/>
						</svg>
					</Link>
				) : null}
				{large ? null : (
					<h1 className="top-app-bar__title" title={title}>
						{title}
					</h1>
				)}
				<div className="top-app-bar__trailing">{trailing}</div>
			</div>
			{large ? (
				<div className="top-app-bar__headline">
					<h1 className="top-app-bar__headline-text">{title}</h1>
					{subtitle ? <p className="top-app-bar__subtitle">{subtitle}</p> : null}
				</div>
			) : null}
		</header>
	);
}
