"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

import { useRef, useEffect, useState } from "react";

interface MathLiveFieldProps {
  value: string;
  onChange: (latex: string) => void;
  className?: string;
}

export function MathLiveField({ value, onChange, className }: MathLiveFieldProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mfRef = useRef<any>(null);
  const onChangeRef = useRef(onChange);
  const [mounted, setMounted] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  // Keep callback ref in sync without re-attaching listeners
  onChangeRef.current = onChange;

  // Dynamic import to avoid SSR crash
  useEffect(() => {
    let cancelled = false;
    import("mathlive").then((ml) => {
      if (cancelled) return;

      const MathfieldElement = (ml as any).MathfieldElement ?? (ml as any).default?.MathfieldElement;
      if (MathfieldElement?.fontsDirectory !== undefined) {
        MathfieldElement.fontsDirectory = "/mathlive-fonts";
      }

      setMounted(true);
    });
    return () => { cancelled = true; };
  }, []);

  // Create math-field element once after mount
  useEffect(() => {
    if (!mounted || !containerRef.current || mfRef.current) return;

    const mf = document.createElement("math-field") as any;
    mf.setAttribute("virtual-keyboard-mode", "onfocus");
    mf.smartSuperscript = false;
    mf.smartMode = true;
    mf.mathModeSpace = "\\;";

    // Fix German keyboard: ^ (IntlBackslash) conflicts with switchMode("latex")
    const removeConflict = (bindings: any[]) =>
      bindings.filter((kb: any) => {
        if (kb.key === "[IntlBackslash]") {
          const cmd = kb.command;
          if (Array.isArray(cmd) && cmd[0] === "switchMode" && cmd[1] === "latex") return false;
        }
        return true;
      });

    // Add custom keybindings + remove IntlBackslash conflict
    const patchBindings = (bindings: any[]) => [
      ...removeConflict(bindings),
      // Cmd+Backspace: delete to start of field
      { key: "meta+backspace", command: "deleteToMathFieldStart" },
      // Cmd+Delete: delete to end of field
      { key: "meta+delete", command: "deleteToMathFieldEnd" },
    ];

    try { mf.keybindings = patchBindings(mf.keybindings ?? []); } catch { /* */ }

    const handleInput = () => {
      // Read LaTeX directly from the element using getValue for reliability
      const latex = mf.getValue?.("latex") ?? mf.value ?? "";
      onChangeRef.current(latex);
    };

    mf.value = value;
    mf.addEventListener("input", handleInput);

    containerRef.current.innerHTML = "";
    containerRef.current.appendChild(mf);
    mfRef.current = mf;

    // Re-apply after element is connected
    requestAnimationFrame(() => {
      try { mf.keybindings = patchBindings(mf.keybindings ?? []); } catch { /* */ }
    });

    return () => {
      mf.removeEventListener("input", handleInput);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted]);

  // Sync external value changes
  useEffect(() => {
    if (mfRef.current && mfRef.current.value !== value) {
      mfRef.current.value = value;
    }
  }, [value]);

  // Listen for virtual keyboard show/hide
  useEffect(() => {
    if (!mounted) return;

    const vk = (window as any).mathVirtualKeyboard;
    if (!vk) return;

    const handleToggle = () => {
      setKeyboardVisible(vk.visible ?? false);
    };

    vk.addEventListener("virtual-keyboard-toggle", handleToggle);
    return () => vk.removeEventListener("virtual-keyboard-toggle", handleToggle);
  }, [mounted]);

  return (
    <div
      ref={containerRef}
      className={className}
      data-keyboard-visible={keyboardVisible || undefined}
    >
      {!mounted && <div className="math-field-placeholder" />}
    </div>
  );
}
