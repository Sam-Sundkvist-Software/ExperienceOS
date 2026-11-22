Master Plan: ExperienceOS
=========================

Content Table
-------------

|ID|Name|Version|Author|
|---|---|---|---|
|bootcore|Boot-up Manager|1.0|Samsoft|
|adrt|Application Dearchival Runtime|2.0|Samsoft|
|eccf|ExperienceOS Central Component Framework|2.0|Samsoft|
|clrc    |ClearCore UI Framework|0.1|Samsoft|
|apsys|Application Preloader|1.0|Samsoft|
|expfs|ExperienceOS File System|2.0|Samsoft|
|sct|SystemCT Registry|2.0|Samsoft|
|skrt|System Kernel Runtime|2.0|Samsoft|

---

### 1. BootCore

**Overview**

An experimental boot-up system for ExperienceOS. Handles the startup, loading of VFS and Registry data and launches essential services.

### 2. Application Dearchival Runtime (ADR)

**Overview**

Dearchives applications from disk on demand into a cache. Capable of executing dearchived applications with arguments. Stores simple necessary system apps, such as "About", internally.

### 3. ComponentFramework *(currently being phased out)*

**Overview**

Provides simple and intuitive controls to create gorgeous, native user interfaces for ExperienceOS. Raw HTML should not be used, as the ECCF has OS-native styles in use readily.

**Alternatives**

Consider using the ClearCore UI Framework instead.

### 4. ClearCore

**Overview**

A more native, data-oriented UI based on JSON, intended to replace the old ECCF UI Framework.

### 5. Application Preloader (AP) *(deprecated)*

**Overview**

A legacy system designed to preload apps for reduced runtime wait time when launching apps. Deprecated due to the small benefit.

### 6. Virtual File System (VFS)

**Overview**

The primary link for file and directory storage for ExperienceOS. Essential for any application or to store user files.

### 7. Registry

**Overview**

Simple configuration storage manager. Allows the system and apps to load and store relevant settings. Based on the legacy SCT (System Configuration Table), now renamed to SystemCT Registry, with a clearer purpose.

### 8. Kernel

**Overview**

Manages most of the system, all applications and provides a comprehensive API for deep system management.
