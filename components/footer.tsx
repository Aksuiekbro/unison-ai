"use client";

import { Logotype } from "@/components/logotype"
import { useI18n } from "@/components/i18n/I18nProvider"

export function Footer() {
  const { t } = useI18n()

  return (
    <footer id="footer" className="border-t border-gray-200 bg-white">
      <div className="container mx-auto px-4 py-12 md:px-6">
        <div className="grid gap-8 md:grid-cols-4">
          <div className="flex flex-col gap-4">
            <a href="#" className="flex items-center gap-2">
              <Logotype className="h-8 w-8" />
              <span className="text-xl font-bold">{t('components.footer.brandName')}</span>
            </a>
            <p className="text-sm text-gray-600">{t('components.footer.tagline')}</p>
          </div>
          <div>
            <h4 className="font-semibold">{t('components.footer.product.title')}</h4>
            <ul className="mt-4 space-y-2 text-sm">
              <li>
                <a href="#" className="text-gray-600 hover:text-gray-900">
                  {t('components.footer.product.features')}
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-600 hover:text-gray-900">
                  {t('components.footer.product.pricing')}
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-600 hover:text-gray-900">
                  {t('components.footer.product.integrations')}
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-600 hover:text-gray-900">
                  {t('components.footer.product.changelog')}
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold">{t('components.footer.company.title')}</h4>
            <ul className="mt-4 space-y-2 text-sm">
              <li>
                <a href="#" className="text-gray-600 hover:text-gray-900">
                  {t('components.footer.company.about')}
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-600 hover:text-gray-900">
                  {t('components.footer.company.careers')}
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-600 hover:text-gray-900">
                  {t('components.footer.company.blog')}
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-600 hover:text-gray-900">
                  {t('components.footer.company.contact')}
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold">{t('components.footer.legal.title')}</h4>
            <ul className="mt-4 space-y-2 text-sm">
              <li>
                <a href="#" className="text-gray-600 hover:text-gray-900">
                  {t('components.footer.legal.privacy')}
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-600 hover:text-gray-900">
                  {t('components.footer.legal.terms')}
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-8 border-t border-gray-200 pt-8 text-center text-sm text-gray-500">
          <p>{t('components.footer.contact.title')}:</p>
          <p>
            {t('components.footer.contact.email')}: unisonai.app@gmail.com
          </p>
          <p>
            {t('components.footer.contact.instagram')}: <a href="https://instagram.com/unisonai.app">@unisonai.app</a>
          </p>
          <p>{t('components.footer.rights', { year: new Date().getFullYear() })}</p>
        </div>
      </div>
    </footer>
  )
}
