Master Plan: ExperienceOS
=========================

1.	BootCore
	--------
	**Details**
	Id			bootcore
	Name		Boot-up Manager
	Version		1.0
	Author		Samsoft
	
	**Overview**
	An experimental boot-up system for ExperienceOS. Handles the startup, loading of VFS and Registry data and launches essential services.

2.	Application Dearchival Runtime (ADR)
	------------------------------------
	**Details**
	Id			adrt
	Name		Application Dearchival Runtime
	Version		2.0
	Author		Samsoft
	
	**Overview**
	Dearchives applications from disk on demand into a cache. Capable of executing dearchived applications with arguments. Stores simple necessary system apps, such as "About", internally.

3.	ComponentFramework *(currently being phased out)*
	------------------
	**Details**
	Id			eccf
	Name		ExperienceOS Central Component Framework
	Version		2.0
	Author		Samsoft
	
	**Overview**
	Provides simple and intuitive controls to create gorgeous, native user interfaces for ExperienceOS. Raw HTML should not be used, as the ECCF has OS-native styles in use readily.
	
	**Alternatives**
	Consider using the ClearBatch UI Framework instead.

4.	ClearBatch
	----------
	**Details**
	Id			clearb
	Name		ClearBatch UI Framework
	Version		0.1
	Author		Samsoft
	
	**Overview**
	A more native, data-oriented UI based on JSON, intended to replace the old ECCF UI Framework.

5.	Application Preloader (AP) *(deprecated)*
	--------------------------
	**Details**
	Id			apsys
	Name		Application Preloader
	Version		1.0
	Author		Samsoft
	
	**Overview**
	A legacy system designed to preload apps for reduced runtime wait time when launching apps. Deprecated due to the small benefit.

6.	Virtual File System (VFS)
	-------------------------
	**Details**
	Id			expfs
	Name		ExperienceOS File System
	Version		2.0
	Author		Samsoft
	
	**Overview**
	The primary link for file and directory storage for ExperienceOS. Essential for any application or to store user files.

7.	Registry
	--------
	**Details**
	Id			sct
	Name		SystemCT Registry
	Version		2.0
	Author		Samsoft
	
	**Overview**
	Simple configuration storage manager. Allows the system and apps to load and store relevant settings. Based on the legacy SCT (System Configuration Table), now renamed to SystemCT Registry, with a clearer purpose.

8.	Kernel
	------
	**Details**
	Id			skrt
	Name		System Kernel Runtime
	Version		2.0
	Author		Samsoft
	
	**Overview**
	Manages most of the system, all applications and provides a comprehensive API for deep system management.
