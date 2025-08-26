#!/usr/bin/env python3
"""
Script pour analyser les fichiers publicodes et identifier les règles sans titre.
"""

import os
import re
import glob

def analyze_publicodes_file(file_path):
    """Analyse un fichier publicodes et retourne les règles sans titre."""
    rules_without_title = []
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Trouver toutes les règles (lignes qui se terminent par :)
        rule_pattern = r'^([a-zA-Z][^:]*):\s*$'
        rules = re.findall(rule_pattern, content, re.MULTILINE)
        
        # Pour chaque règle, vérifier si elle a un titre
        for rule in rules:
            rule_name = rule.strip()
            
            # Chercher le titre de cette règle
            # Le titre doit être dans la section de la règle
            title_pattern = rf'^{re.escape(rule_name)}:\s*$(.*?)(?=^[a-zA-Z][^:]*:\s*$|$)'
            rule_section = re.search(title_pattern, content, re.MULTILINE | re.DOTALL)
            
            if rule_section:
                rule_content = rule_section.group(1)
                # Vérifier si le titre est défini
                if 'titre:' not in rule_content:
                    rules_without_title.append(rule_name)
        
        return rules_without_title
        
    except Exception as e:
        print(f"Erreur lors de l'analyse de {file_path}: {e}")
        return []

def main():
    """Fonction principale."""
    data_dir = "data"
    
    # Trouver tous les fichiers .publicodes
    publicodes_files = glob.glob(f"{data_dir}/**/*.publicodes", recursive=True)
    
    all_rules_without_title = {}
    
    for file_path in publicodes_files:
        print(f"Analyse de {file_path}...")
        rules_without_title = analyze_publicodes_file(file_path)
        
        if rules_without_title:
            all_rules_without_title[file_path] = rules_without_title
            print(f"  - {len(rules_without_title)} règles sans titre trouvées")
        else:
            print(f"  - Toutes les règles ont un titre")
    
    # Afficher le résumé
    print("\n" + "="*50)
    print("RÉSUMÉ DES RÈGLES SANS TITRE")
    print("="*50)
    
    total_rules = 0
    for file_path, rules in all_rules_without_title.items():
        print(f"\n{file_path}:")
        for rule in rules:
            print(f"  - {rule}")
            total_rules += 1
    
    print(f"\nTotal: {total_rules} règles sans titre trouvées dans {len(all_rules_without_title)} fichiers")

if __name__ == "__main__":
    main()


